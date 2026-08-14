import json
import os
import re
from typing import Any, Dict

import httpx
from fastapi import HTTPException, status

DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
DEFAULT_SUMMARY_WORD_COUNT = int(os.getenv("AI_SUMMARY_DEFAULT_WORDS", "60"))

FORMAT_AND_SCOPE_SUFFIX = (
    " If you need formatting, you may use only <b></b>, <i></i>, and <u></u>. "
    "Do not use any other markdown or formatting syntax. "
    "Analyze the paragraphs only; do not judge dates, headings, or other formatting elements because those are part of the resume structure."
)

RESUME_REVIEW_PROMPTS = {
    "ats_review": (
        "You are an ATS resume reviewer. Review the resume for ATS friendliness, structure, keyword coverage, "
        "clarity, and recruiter readability. Return only plain text. Do not use markdown, bullets, tables, or code fences. "
        "Write concise paragraphs and actionable suggestions." + FORMAT_AND_SCOPE_SUFFIX
    ),
    "keyword_scan": (
        "You are a resume keyword strategist. Identify likely missing keywords, weak phrasing, and section-level opportunities "
        "to better match ATS systems. Return only plain text. Do not use markdown, bullets, tables, or code fences. "
        "Write concise paragraphs and actionable suggestions." + FORMAT_AND_SCOPE_SUFFIX
    ),
    "impact_review": (
        "You are a senior resume writer. Review the resume for impact, measurable outcomes, strong action verbs, and specificity. "
        "Return only plain text. Do not use markdown, bullets, tables, or code fences. Write concise paragraphs and actionable suggestions."
        + FORMAT_AND_SCOPE_SUFFIX
    ),
    "conciseness_check": (
        "You are a resume editor. Review the resume for unnecessary repetition, wordiness, and places where content can be tightened "
        "without losing meaning. Return only plain text. Do not use markdown, bullets, tables, or code fences. Write concise paragraphs "
        "and actionable suggestions." + FORMAT_AND_SCOPE_SUFFIX
    ),
}

RESUME_CONTEXT_EXCLUDED_KEYS = {
    "profile_pic_path",
    "logo_path",
    "name",
    "gender",
    "dob",
    "email",
    "phone",
    "educations",
    "footer_text",
}

SYSTEM_PROMPTS = {
    "proofread": (
        "You are a professional resume editor. Fix grammar, punctuation, spacing, and clarity. "
        "Preserve the original meaning, facts, structure, and approximate length. "
        "Do not add new information, do not use markdown, and return only the corrected target text." + FORMAT_AND_SCOPE_SUFFIX
    ),
    "professional": (
        "You are a senior resume writer. Rewrite the target text in a polished, professional, ATS-friendly resume tone. "
        "Keep the facts unchanged, improve phrasing, use strong action language where appropriate, and stay concise. "
        "Do not invent achievements, do not add markdown, and return only the rewritten target text." + FORMAT_AND_SCOPE_SUFFIX
    ),
    "summary": (
        "You are a resume editor. Condense the target text into a concise resume-friendly summary. "
        "Keep the key facts and meaning, avoid filler, and aim for the requested word count. "
        "Do not add markdown, do not add explanations, and return only the summarized target text." + FORMAT_AND_SCOPE_SUFFIX
    ),
}


def ai_rewrite_ready() -> bool:
    return bool(GROQ_API_KEY)


def build_section_context_payload(request_data: Dict[str, Any]) -> str:
    payload = {
        "field_label": request_data.get("field_label", ""),
        "action": request_data.get("action", ""),
        "summary_word_count": request_data.get("summary_word_count"),
        "section_context": request_data.get("section_context", {}),
        "target_text": request_data.get("target_text", ""),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def build_messages(request_data: Dict[str, Any]) -> list[Dict[str, str]]:
    action = request_data["action"]
    summary_word_count = request_data.get("summary_word_count") or DEFAULT_SUMMARY_WORD_COUNT
    system_prompt = SYSTEM_PROMPTS[action]

    if action == "summary":
        system_prompt = (
            system_prompt
            + f" The target summary length is approximately {summary_word_count} words. "
            + "If the input is already short, keep it compact rather than padding it."
        )

    context_payload = build_section_context_payload(request_data)
    user_prompt = (
        "Rewrite only the target field from the following resume section context. "
        "Use the surrounding data for context, but return only the corrected target text in plain English. "
        "Focus on the paragraph content, not dates, headings, or other layout-only elements.\n\n"
        f"{context_payload}"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def clean_model_output(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3]
    if text.lower().startswith("rewritten text:"):
        text = text.split(":", 1)[1].strip()
    return text.strip().strip('"').strip("'")


def clean_plain_text_output(content: str) -> str:
    text = clean_model_output(content)
    cleaned_lines = []
    for line in text.splitlines():
        stripped_line = line.strip()
        stripped_line = re.sub(r"^#{1,6}\s*", "", stripped_line)
        stripped_line = re.sub(r"^[-*+]\s+", "", stripped_line)
        stripped_line = re.sub(r"^\d+[.)]\s+", "", stripped_line)
        cleaned_lines.append(stripped_line)
    return "\n".join(cleaned_lines).strip()


def sanitize_resume_context(resume_context: Dict[str, Any]) -> Dict[str, Any]:
    return {
        key: value
        for key, value in resume_context.items()
        if key not in RESUME_CONTEXT_EXCLUDED_KEYS
    }


async def rewrite_resume_text(request_data: Dict[str, Any]) -> str:
    if not ai_rewrite_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI rewrite is not configured on this backend.",
        )

    messages = build_messages(request_data)
    payload = {
        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
        "messages": messages,
        "temperature": float(os.getenv("GROQ_TEMPERATURE", "0.2")),
        "max_tokens": int(os.getenv("GROQ_MAX_TOKENS", "1024")),
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=payload)

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq request failed while rewriting the resume text.",
        )

    response_json = response.json()
    choices = response_json.get("choices") or []
    if not choices:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned an empty rewrite response.",
        )

    message = choices[0].get("message") or {}
    content = message.get("content") or ""
    rewritten_text = clean_model_output(content)

    if not rewritten_text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned no usable text.",
        )

    return rewritten_text


def build_resume_review_messages(request_data: Dict[str, Any]) -> list[Dict[str, str]]:
    review_type = request_data["review_type"]
    system_prompt = RESUME_REVIEW_PROMPTS[review_type]
    context_payload = json.dumps(
        {
            "review_type": review_type,
            "resume_context": sanitize_resume_context(request_data.get("resume_context", {})),
        },
        ensure_ascii=False,
        indent=2,
    )
    user_prompt = (
        "Review this resume context and return only plain text with actionable suggestions. "
        "Keep the response direct and ATS-focused. Focus on the paragraph content, not dates, headings, or other layout-only elements.\n\n"
        f"{context_payload}"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


async def review_resume_text(request_data: Dict[str, Any]) -> str:
    if not ai_rewrite_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI review is not configured on this backend.",
        )

    messages = build_resume_review_messages(request_data)
    payload = {
        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
        "messages": messages,
        "temperature": float(os.getenv("GROQ_TEMPERATURE", "0.2")),
        "max_tokens": int(os.getenv("GROQ_MAX_TOKENS", "1024")),
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(GROQ_API_URL, headers=headers, json=payload)

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq request failed while reviewing the resume.",
        )

    response_json = response.json()
    choices = response_json.get("choices") or []
    if not choices:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned an empty review response.",
        )

    message = choices[0].get("message") or {}
    content = message.get("content") or ""
    review_text = clean_plain_text_output(content)

    if not review_text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq returned no usable review text.",
        )

    return review_text