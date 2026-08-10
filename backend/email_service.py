import smtplib
import logging
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import (
    ADMIN_NOTIFICATION_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD
)

logger = logging.getLogger("crimegpt.email")

def send_registration_approval_email(user_data: dict, approve_url: str, reject_url: str):
    """
    Spawns a background thread to send an officer registration approval request
    to the designated administrator email (default: rituchaudhary15077@gmail.com).
    """
    thread = threading.Thread(
        target=_send_email_task,
        args=(user_data, approve_url, reject_url),
        daemon=True
    )
    thread.start()

def _send_email_task(user_data: dict, approve_url: str, reject_url: str):
    target_email = ADMIN_NOTIFICATION_EMAIL
    username = user_data.get("username", "Unknown")
    email = user_data.get("email", "N/A")
    phone = user_data.get("phone", "N/A")
    badge = user_data.get("badge_number", "N/A")
    station = user_data.get("station", "Central Cyber Police Station")
    designation = user_data.get("designation", "Investigating Officer")
    role = str(user_data.get("role", "officer")).upper()

    subject = f"[NyayaIQ] New Officer Registration Approval Required: {username}"

    # Rich HTML Email Body
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }}
            .header p {{ margin: 6px 0 0 0; font-size: 12px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }}
            .content {{ padding: 28px; }}
            .badge-box {{ background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; }}
            .badge-box p {{ margin: 0; font-size: 13px; color: #1e40af; font-weight: 600; }}
            .table-info {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
            .table-info td {{ padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }}
            .table-info td.label {{ font-weight: 700; color: #475569; width: 35%; text-transform: uppercase; font-size: 11px; tracking: 0.5px; }}
            .table-info td.value {{ color: #0f172a; font-size: 14px; font-weight: 500; }}
            .actions {{ text-align: center; margin-top: 30px; margin-bottom: 20px; display: flex; justify-content: center; gap: 15px; }}
            .btn {{ display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; text-align: center; transition: background 0.2s; }}
            .btn-approve {{ background-color: #059669; color: #ffffff !important; margin-right: 10px; }}
            .btn-reject {{ background-color: #dc2626; color: #ffffff !important; }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>NyayaIQ Access Control</h1>
                <p>New Officer Account Registration Request</p>
            </div>
            <div class="content">
                <div class="badge-box">
                    <p>A new law enforcement user has registered and is awaiting your authorization.</p>
                </div>
                <table class="table-info">
                    <tr><td class="label">Username</td><td class="value"><strong>{username}</strong></td></tr>
                    <tr><td class="label">Email Address</td><td class="value">{email}</td></tr>
                    <tr><td class="label">Phone Number</td><td class="value">{phone}</td></tr>
                    <tr><td class="label">Badge Number</td><td class="value">{badge}</td></tr>
                    <tr><td class="label">Designation</td><td class="value">{designation}</td></tr>
                    <tr><td class="label">Police Station</td><td class="value">{station}</td></tr>
                    <tr><td class="label">Requested Role</td><td class="value"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 700;">{role}</span></td></tr>
                </table>
                
                <p style="font-size: 13px; color: #475569; text-align: center; margin-bottom: 20px;">
                    Review the details above and choose an action below to grant or deny access:
                </p>

                <div class="actions">
                    <a href="{approve_url}" class="btn btn-approve" target="_blank">✓ Approve Access Now</a>
                    <a href="{reject_url}" class="btn btn-reject" target="_blank">✕ Reject Registration</a>
                </div>
            </div>
            <div class="footer">
                <p>NyayaIQ Crime GPT Intelligence System • Confidential Law Enforcement Portal</p>
                <p>Notification sent directly to Superintendent / Admin ({target_email})</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Print to console for immediate visibility during dev/testing
    logger.info("================ EMAIL APPROVAL NOTIFICATION ================")
    logger.info("Target Email : %s", target_email)
    logger.info("New Officer  : %s (%s)", username, email)
    logger.info("Approve Link : %s", approve_url)
    logger.info("Reject Link  : %s", reject_url)
    logger.info("=============================================================")

    # Send via SMTP if SMTP_USER & SMTP_PASSWORD are provided
    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"NyayaIQ Access Control <{SMTP_USER}>"
            msg["To"] = target_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, target_email, msg.as_string())
            logger.info("Successfully sent registration approval email to %s via SMTP", target_email)
        except Exception as e:
            logger.error("Failed to send email via SMTP: %s", e)
    else:
        logger.info("SMTP_USER or SMTP_PASSWORD not configured in .env. Approval link generated and logged above.")
