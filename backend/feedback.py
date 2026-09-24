import asyncio
import os
import smtplib
from email.message import EmailMessage
from html import escape

from dotenv import load_dotenv


load_dotenv()


def _send_feedback_email(name: str, feedback: str) -> None:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    receiver_email = os.getenv("FEEDBACK_RECEIVER_EMAIL")

    missing = [
        variable for variable, value in {
            "SMTP_USER": smtp_user,
            "SMTP_PASSWORD": smtp_password,
            "FEEDBACK_RECEIVER_EMAIL": receiver_email,
        }.items() if not value
    ]
    if missing:
        raise RuntimeError(f"Missing feedback email configuration: {', '.join(missing)}")

    safe_name = escape(name)
    safe_feedback = escape(feedback).replace("\n", "<br>")
    message = EmailMessage()
    message["Subject"] = f"RESUME-MAKER FEEDBACK - {name}"
    message["From"] = smtp_user
    message["To"] = receiver_email
    message.set_content(f"Feedback from {name}:\n\n{feedback}")
    message.add_alternative(
        f"""\
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
        """,
        subtype="html",
    )

    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(message)


async def send_feedback_email(name: str, feedback: str) -> None:
    await asyncio.to_thread(_send_feedback_email, name, feedback)