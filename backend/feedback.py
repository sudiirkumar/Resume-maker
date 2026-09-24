import asyncio
import os
from html import escape

from dotenv import load_dotenv
import resend


load_dotenv()


def _send_feedback_email(name: str, feedback: str) -> None:
    resend_api_key = os.getenv("RESEND_API_KEY")
    receiver_email = os.getenv("FEEDBACK_RECEIVER_EMAIL")

    missing = [
        variable for variable, value in {
            "RESEND_API_KEY": resend_api_key,
            "FEEDBACK_RECEIVER_EMAIL": receiver_email,
        }.items() if not value
    ]
    if missing:
        raise RuntimeError(f"Missing feedback email configuration: {', '.join(missing)}")

    safe_name = escape(name)
    safe_feedback = escape(feedback).replace("\n", "<br>")
    html = f"""\
        <!doctype html>
        <html>
        <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <div style="padding:22px 26px;background:#0f172a;color:#ffffff;">
                    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#cbd5e1;">Resume Maker</div>
                    <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;">New feedback received</h1>
                </div>
                <div style="padding:26px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">From</p>
                    <p style="margin:0 0 24px;font-size:17px;font-weight:600;">{safe_name}</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Feedback</p>
                    <div style="padding:16px;background:#f8fafc;border-left:4px solid #3b82f6;line-height:1.6;white-space:normal;">{safe_feedback}</div>
                </div>
            </div>
        </body>
        </html>
        """

    resend.api_key = resend_api_key
    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": receiver_email,
            "subject": f"RESUME-MAKER FEEDBACK - {name}",
            "html": html,
        })
    except Exception as exc:
        raise OSError("Resend could not deliver the feedback email") from exc


async def send_feedback_email(name: str, feedback: str) -> None:
    await asyncio.to_thread(_send_feedback_email, name, feedback)