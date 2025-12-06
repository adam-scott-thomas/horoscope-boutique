"""
Scheduler Module
Handles automated daily horoscope sending with multiple delivery modes
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Optional
from generator import generate_single_horoscope, generate_couples_horoscope
from sms import send_horoscope_sms, send_to_multiple as send_sms_to_multiple
from email_sender import send_horoscope_email, send_to_multiple_emails

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SchedulerConfig:
    """Configuration for scheduled horoscope delivery"""
    
    def __init__(self):
        # Delivery mode: "sms", "email", "both", "couple_sms", "couple_email", "couple_both"
        self.DELIVERY_MODE = os.getenv("DELIVERY_MODE", "sms")
        
        # Single person configuration
        self.NAME = os.getenv("RECIPIENT_NAME", "Friend")
        self.SIGN = os.getenv("RECIPIENT_SIGN", "Aries")
        self.PHONE = os.getenv("RECIPIENT_PHONE", "")
        self.EMAIL = os.getenv("RECIPIENT_EMAIL", "")
        
        # Couples configuration
        self.NAME_1 = os.getenv("COUPLE_NAME_1", "")
        self.SIGN_1 = os.getenv("COUPLE_SIGN_1", "")
        self.PHONE_1 = os.getenv("COUPLE_PHONE_1", "")
        self.EMAIL_1 = os.getenv("COUPLE_EMAIL_1", "")
        
        self.NAME_2 = os.getenv("COUPLE_NAME_2", "")
        self.SIGN_2 = os.getenv("COUPLE_SIGN_2", "")
        self.PHONE_2 = os.getenv("COUPLE_PHONE_2", "")
        self.EMAIL_2 = os.getenv("COUPLE_EMAIL_2", "")
        
        # VoIP.ms SMS configuration
        self.VOIPMS_USERNAME = os.getenv("VOIPMS_API_USERNAME", "")
        self.VOIPMS_PASSWORD = os.getenv("VOIPMS_API_PASSWORD", "")
        self.VOIPMS_DID = os.getenv("VOIPMS_DID", "")
        
        # Email provider: "smtp", "mailgun", "sendgrid"
        self.EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "smtp")
        
        # SMTP configuration
        self.SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
        self.SMTP_USER = os.getenv("SMTP_USER", "")
        self.SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
        self.SMTP_FROM = os.getenv("SMTP_FROM", "")
        
        # Mailgun configuration
        self.MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY", "")
        self.MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN", "")
        self.MAILGUN_FROM = os.getenv("MAILGUN_FROM", "")
        
        # SendGrid configuration
        self.SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
        self.SENDGRID_FROM = os.getenv("SENDGRID_FROM", "")


def send_daily_horoscope(config: Optional[SchedulerConfig] = None) -> Dict:
    """
    Main function to send daily horoscope based on configuration.
    
    Args:
        config: SchedulerConfig instance (creates new one if None)
    
    Returns:
        Dict with delivery status
    """
    if config is None:
        config = SchedulerConfig()
    
    logger.info(f"Starting daily horoscope delivery. Mode: {config.DELIVERY_MODE}")
    
    try:
        # Determine if couples mode
        is_couples_mode = config.DELIVERY_MODE.startswith("couple_")
        
        if is_couples_mode:
            return send_couples_horoscope_scheduled(config)
        else:
            return send_single_horoscope_scheduled(config)
            
    except Exception as e:
        logger.error(f"Error in daily horoscope delivery: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


def send_single_horoscope_scheduled(config: SchedulerConfig) -> Dict:
    """Send single person horoscope"""
    
    # Generate horoscope
    logger.info(f"Generating horoscope for {config.NAME} ({config.SIGN})")
    horoscope_data = generate_single_horoscope(
        name=config.NAME,
        sign=config.SIGN
    )
    
    results = {
        "success": True,
        "mode": "single",
        "delivery_mode": config.DELIVERY_MODE,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Send via SMS
    if config.DELIVERY_MODE in ["sms", "both"]:
        if not config.PHONE:
            logger.warning("SMS delivery requested but no phone number configured")
            results["sms_error"] = "No phone number configured"
        elif not config.VOIPMS_USERNAME or not config.VOIPMS_PASSWORD:
            logger.warning("SMS delivery requested but VoIP.ms not configured")
            results["sms_error"] = "VoIP.ms not configured"
        else:
            logger.info(f"Sending SMS to {config.PHONE}")
            sms_result = send_horoscope_sms(
                api_username=config.VOIPMS_USERNAME,
                api_password=config.VOIPMS_PASSWORD,
                did=config.VOIPMS_DID,
                dst=config.PHONE,
                horoscope_data=horoscope_data,
                is_couples=False
            )
            results["sms_result"] = sms_result
    
    # Send via Email
    if config.DELIVERY_MODE in ["email", "both"]:
        if not config.EMAIL:
            logger.warning("Email delivery requested but no email configured")
            results["email_error"] = "No email configured"
        else:
            logger.info(f"Sending email to {config.EMAIL}")
            email_config = get_email_config(config)
            email_result = send_horoscope_email(
                provider=config.EMAIL_PROVIDER,
                to_email=config.EMAIL,
                horoscope_data=horoscope_data,
                is_couples=False,
                **email_config
            )
            results["email_result"] = email_result
    
    return results


def send_couples_horoscope_scheduled(config: SchedulerConfig) -> Dict:
    """Send couples horoscope"""
    
    # Generate couples horoscope
    logger.info(f"Generating couples horoscope for {config.NAME_1} & {config.NAME_2}")
    horoscope_data = generate_couples_horoscope(
        name_1=config.NAME_1,
        sign_1=config.SIGN_1,
        name_2=config.NAME_2,
        sign_2=config.SIGN_2
    )
    
    results = {
        "success": True,
        "mode": "couples",
        "delivery_mode": config.DELIVERY_MODE,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Determine delivery channels
    send_sms = config.DELIVERY_MODE in ["couple_sms", "couple_both"]
    send_email = config.DELIVERY_MODE in ["couple_email", "couple_both"]
    
    # Send via SMS
    if send_sms:
        phone_numbers = []
        if config.PHONE_1:
            phone_numbers.append(config.PHONE_1)
        if config.PHONE_2:
            phone_numbers.append(config.PHONE_2)
        
        if not phone_numbers:
            logger.warning("SMS delivery requested but no phone numbers configured")
            results["sms_error"] = "No phone numbers configured"
        elif not config.VOIPMS_USERNAME or not config.VOIPMS_PASSWORD:
            logger.warning("SMS delivery requested but VoIP.ms not configured")
            results["sms_error"] = "VoIP.ms not configured"
        else:
            logger.info(f"Sending SMS to {len(phone_numbers)} recipient(s)")
            sms_result = send_sms_to_multiple(
                api_username=config.VOIPMS_USERNAME,
                api_password=config.VOIPMS_PASSWORD,
                did=config.VOIPMS_DID,
                destinations=phone_numbers,
                horoscope_data=horoscope_data,
                is_couples=True
            )
            results["sms_result"] = sms_result
    
    # Send via Email
    if send_email:
        email_addresses = []
        if config.EMAIL_1:
            email_addresses.append(config.EMAIL_1)
        if config.EMAIL_2:
            email_addresses.append(config.EMAIL_2)
        
        if not email_addresses:
            logger.warning("Email delivery requested but no emails configured")
            results["email_error"] = "No email addresses configured"
        else:
            logger.info(f"Sending email to {len(email_addresses)} recipient(s)")
            email_config = get_email_config(config)
            email_result = send_to_multiple_emails(
                provider=config.EMAIL_PROVIDER,
                recipients=email_addresses,
                horoscope_data=horoscope_data,
                is_couples=True,
                **email_config
            )
            results["email_result"] = email_result
    
    return results


def get_email_config(config: SchedulerConfig) -> Dict:
    """Get email provider configuration"""
    
    if config.EMAIL_PROVIDER == "smtp":
        return {
            "smtp_host": config.SMTP_HOST,
            "smtp_port": config.SMTP_PORT,
            "smtp_user": config.SMTP_USER,
            "smtp_password": config.SMTP_PASSWORD,
            "from_email": config.SMTP_FROM
        }
    
    elif config.EMAIL_PROVIDER == "mailgun":
        return {
            "api_key": config.MAILGUN_API_KEY,
            "domain": config.MAILGUN_DOMAIN,
            "from_email": config.MAILGUN_FROM
        }
    
    elif config.EMAIL_PROVIDER == "sendgrid":
        return {
            "api_key": config.SENDGRID_API_KEY,
            "from_email": config.SENDGRID_FROM
        }
    
    else:
        raise ValueError(f"Unknown email provider: {config.EMAIL_PROVIDER}")


# Example usage
if __name__ == "__main__":
    print("=" * 60)
    print("SCHEDULER MODULE TEST")
    print("=" * 60)
    
    # Create test configuration
    config = SchedulerConfig()
    config.DELIVERY_MODE = "both"
    config.NAME = "Emma"
    config.SIGN = "Pisces"
    
    print(f"\nDelivery Mode: {config.DELIVERY_MODE}")
    print(f"Recipient: {config.NAME} ({config.SIGN})")
    print(f"Email Provider: {config.EMAIL_PROVIDER}")
    
    # Note: Actual sending requires credentials
    print("\n" + "=" * 60)
    print("To run scheduled delivery, configure environment variables:")
    print("  - DELIVERY_MODE (sms/email/both/couple_sms/couple_email/couple_both)")
    print("  - RECIPIENT_NAME, RECIPIENT_SIGN")
    print("  - RECIPIENT_PHONE, RECIPIENT_EMAIL")
    print("  - VoIP.ms credentials")
    print("  - Email provider credentials")
    print("=" * 60)
