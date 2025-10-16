import smtplib
from email.mime.text import MIMEText
from typing import Dict

def send_email(smtp_config: Dict, to_email: str, subject: str, body: str):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_config.get("from", smtp_config.get("username"))
    msg["To"] = to_email

    server = smtplib.SMTP(smtp_config["host"], smtp_config["port"])
    try:
        server.starttls()
        server.login(smtp_config["username"], smtp_config["password"])
        server.send_message(msg)
    finally:
        server.quit()
