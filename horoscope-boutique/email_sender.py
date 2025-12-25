"""
Email Module - Multi-Provider Support
Sends horoscope emails via SMTP, Mailgun, or SendGrid
"""

import smtplib
import requests
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailError(Exception):
    """Custom exception for email sending errors"""
    pass


# HTML Email Template
HTML_TEMPLATE_SINGLE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✨ Your Daily Horoscope ✨</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Dear {name},</h2>
                            <div style="color: #555; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                                {horoscope}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Lucky Elements -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #667eea; font-weight: bold; font-size: 16px;">🎨 Lucky Color:</span>
                                            <span style="color: #333; margin-left: 10px;">{lucky_color}</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #667eea; font-weight: bold; font-size: 16px;">💫 Today's Mantra:</span>
                                            <span style="color: #333; margin-left: 10px; font-style: italic;">"{mantra}"</span>
                                        </div>
                                        <div>
                                            <span style="color: #667eea; font-weight: bold; font-size: 16px;">🎯 Daily Focus:</span>
                                            <span style="color: #333; margin-left: 10px;">{daily_focus}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 14px; margin: 0;">
                                Wishing you a beautiful day ahead! 💜
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

HTML_TEMPLATE_COUPLES = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💕 Your Couples Horoscope 💕</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Dear {name_1} & {name_2},</h2>
                            <div style="color: #555; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                                {couples_horoscope}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Relationship Elements -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff5f8; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #f5576c; font-weight: bold; font-size: 16px;">🎨 Lucky Color:</span>
                                            <span style="color: #333; margin-left: 10px;">{lucky_color}</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #f5576c; font-weight: bold; font-size: 16px;">💫 Shared Mantra:</span>
                                            <span style="color: #333; margin-left: 10px; font-style: italic;">"{shared_mantra}"</span>
                                        </div>
                                        <div>
                                            <span style="color: #f5576c; font-weight: bold; font-size: 16px;">💞 Relationship Focus:</span>
                                            <span style="color: #333; margin-left: 10px;">{relationship_focus}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 14px; margin: 0;">
                                Wishing you both love and happiness! ❤️
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def format_plain_text_single(data: Dict) -> str:
    """Format single horoscope as plain text"""
    text = f"✨ YOUR DAILY HOROSCOPE ✨\n\n"
    text += f"Dear {data['name']},\n\n"
    text += f"{data['horoscope']}\n\n"
    text += f"━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    text += f"🎨 Lucky Color: {data['lucky_color']}\n"
    text += f"💫 Today's Mantra: \"{data['mantra']}\"\n"
    text += f"🎯 Daily Focus: {data['daily_focus']}\n\n"
    text += f"Wishing you a beautiful day ahead! 💜"
    return text


def format_plain_text_couples(data: Dict) -> str:
    """Format couples horoscope as plain text"""
    text = f"💕 YOUR COUPLES HOROSCOPE 💕\n\n"
    text += f"Dear {data['name_1']} & {data['name_2']},\n\n"
    text += f"{data['couples_horoscope']}\n\n"
    text += f"━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    text += f"🎨 Lucky Color: {data['lucky_color']}\n"
    text += f"💫 Shared Mantra: \"{data['shared_mantra']}\"\n"
    text += f"💞 Relationship Focus: {data['relationship_focus']}\n\n"
    text += f"Wishing you both love and happiness! ❤️"
    return text


def send_email_smtp(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    from_email: str,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    use_tls: bool = True
) -> Dict:
    """
    Send email via SMTP.
    
    Args:
        smtp_host: SMTP server hostname (e.g., 'smtp.gmail.com')
        smtp_port: SMTP port (587 for TLS, 465 for SSL, 25 for no encryption)
        smtp_user: SMTP username
        smtp_password: SMTP password
        from_email: Sender email address
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text fallback
        use_tls: Whether to use TLS encryption
    
    Returns:
        Dict with sending status
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        # Attach parts
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect and send
        logger.info(f"Connecting to SMTP server: {smtp_host}:{smtp_port}")
        
        if use_tls:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
        
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        
        return {
            "success": True,
            "provider": "smtp",
            "recipient": to_email
        }
        
    except Exception as e:
        logger.error(f"SMTP error: {str(e)}")
        return {
            "success": False,
            "provider": "smtp",
            "error": str(e),
            "recipient": to_email
        }


def get_mailgun_base_url(region: str = "us") -> str:
    """
    Get Mailgun API base URL based on region.

    Args:
        region: 'us' or 'eu' (defaults to 'us')

    Returns:
        Mailgun API base URL
    """
    normalized_region = (region or "us").lower().strip()
    if normalized_region == "eu":
        return "https://api.eu.mailgun.net/v3"
    return "https://api.mailgun.net/v3"


def send_email_mailgun(
    api_key: str,
    domain: str,
    from_email: str,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    region: str = "us"
) -> Dict:
    """
    Send email via Mailgun API.

    Args:
        api_key: Mailgun API key
        domain: Mailgun domain
        from_email: Sender email address
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text fallback
        region: 'us' (default) or 'eu' for EU accounts

    Returns:
        Dict with sending status
    """
    try:
        base_url = get_mailgun_base_url(region)
        url = f"{base_url}/{domain}/messages"
        
        data = {
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "text": text_body,
            "html": html_body
        }
        
        logger.info(f"Sending email via Mailgun to {to_email}")
        
        response = requests.post(
            url,
            auth=("api", api_key),
            data=data,
            timeout=10
        )
        
        response.raise_for_status()
        response_data = response.json()
        
        logger.info(f"Email sent successfully. Message ID: {response_data.get('id')}")
        
        return {
            "success": True,
            "provider": "mailgun",
            "recipient": to_email,
            "message_id": response_data.get("id")
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Mailgun error: {str(e)}")
        return {
            "success": False,
            "provider": "mailgun",
            "error": str(e),
            "recipient": to_email
        }


def send_email_sendgrid(
    api_key: str,
    from_email: str,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str
) -> Dict:
    """
    Send email via SendGrid API.
    
    Args:
        api_key: SendGrid API key
        from_email: Sender email address
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text fallback
    
    Returns:
        Dict with sending status
    """
    try:
        url = "https://api.sendgrid.com/v3/mail/send"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "personalizations": [
                {
                    "to": [{"email": to_email}]
                }
            ],
            "from": {"email": from_email},
            "subject": subject,
            "content": [
                {
                    "type": "text/plain",
                    "value": text_body
                },
                {
                    "type": "text/html",
                    "value": html_body
                }
            ]
        }
        
        logger.info(f"Sending email via SendGrid to {to_email}")
        
        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=10
        )
        
        response.raise_for_status()
        
        logger.info(f"Email sent successfully via SendGrid")
        
        return {
            "success": True,
            "provider": "sendgrid",
            "recipient": to_email,
            "status_code": response.status_code
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"SendGrid error: {str(e)}")
        return {
            "success": False,
            "provider": "sendgrid",
            "error": str(e),
            "recipient": to_email
        }


def send_horoscope_email(
    provider: str,
    to_email: str,
    horoscope_data: Dict,
    is_couples: bool = False,
    **provider_config
) -> Dict:
    """
    Send horoscope email using specified provider.
    
    Args:
        provider: 'smtp', 'mailgun', or 'sendgrid'
        to_email: Recipient email address
        horoscope_data: Horoscope data from generator
        is_couples: Whether this is a couples horoscope
        **provider_config: Provider-specific configuration
    
    Returns:
        Dict with sending status
    """
    try:
        # Format email content
        if is_couples:
            html_body = HTML_TEMPLATE_COUPLES.format(**horoscope_data)
            text_body = format_plain_text_couples(horoscope_data)
            subject = "Your Couples Horoscope"
        else:
            html_body = HTML_TEMPLATE_SINGLE.format(**horoscope_data)
            text_body = format_plain_text_single(horoscope_data)
            subject = "Your Daily Horoscope"
        
        # Send via selected provider
        if provider == "smtp":
            return send_email_smtp(
                smtp_host=provider_config.get("smtp_host"),
                smtp_port=provider_config.get("smtp_port", 587),
                smtp_user=provider_config.get("smtp_user"),
                smtp_password=provider_config.get("smtp_password"),
                from_email=provider_config.get("from_email"),
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
                use_tls=provider_config.get("use_tls", True)
            )
        
        elif provider == "mailgun":
            return send_email_mailgun(
                api_key=provider_config.get("api_key"),
                domain=provider_config.get("domain"),
                from_email=provider_config.get("from_email"),
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
        
        elif provider == "sendgrid":
            return send_email_sendgrid(
                api_key=provider_config.get("api_key"),
                from_email=provider_config.get("from_email"),
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
        
        else:
            raise EmailError(f"Unknown provider: {provider}")
        
    except Exception as e:
        logger.error(f"Error sending horoscope email: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "recipient": to_email
        }


def send_to_multiple_emails(
    provider: str,
    recipients: List[str],
    horoscope_data: Dict,
    is_couples: bool = False,
    **provider_config
) -> Dict:
    """
    Send horoscope to multiple email addresses.
    
    Args:
        provider: Email provider to use
        recipients: List of email addresses
        horoscope_data: Horoscope data
        is_couples: Whether this is a couples horoscope
        **provider_config: Provider configuration
    
    Returns:
        Dict with results for all recipients
    """
    results = []
    
    for email in recipients:
        result = send_horoscope_email(
            provider=provider,
            to_email=email,
            horoscope_data=horoscope_data,
            is_couples=is_couples,
            **provider_config
        )
        results.append(result)
    
    success_count = sum(1 for r in results if r.get("success"))
    
    return {
        "total_sent": len(recipients),
        "successful": success_count,
        "failed": len(recipients) - success_count,
        "results": results
    }


# Example usage and testing
if __name__ == "__main__":
    print("=" * 60)
    print("EMAIL MODULE TEST")
    print("=" * 60)
    
    # Test formatting
    single_data = {
        "name": "Emma",
        "sign": "Pisces",
        "horoscope": "Today brings beautiful energy for growth and connection. The universe is supporting your dreams.",
        "lucky_color": "Aquamarine",
        "mantra": "I embrace growth with an open heart",
        "daily_focus": "Self-care"
    }
    
    print("\nPlain Text Single Horoscope:")
    print(format_plain_text_single(single_data))
    
    couples_data = {
        "name_1": "Alex",
        "sign_1": "Leo",
        "name_2": "Jordan",
        "sign_2": "Aquarius",
        "couples_horoscope": "Your combined energy creates magic today. Together you're unstoppable.",
        "lucky_color": "Purple",
        "shared_mantra": "Together, we are stronger",
        "relationship_focus": "Communication"
    }
    
    print("\n" + "=" * 60)
    print("Plain Text Couples Horoscope:")
    print(format_plain_text_couples(couples_data))
    
    print("\n" + "=" * 60)
    print("HTML templates are ready for both single and couples horoscopes")
    print("Configure your email provider to send!")
    print("=" * 60)
