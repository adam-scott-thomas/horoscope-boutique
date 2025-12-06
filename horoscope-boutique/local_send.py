#!/usr/bin/env python3
"""
Local Horoscope Sender - One-Click Script
Interactive CLI tool to generate and send horoscopes via SMS and/or Email
"""

import sys
import argparse
import os
from typing import Optional

# Import our modules
from generator import generate_single_horoscope, generate_couples_horoscope
from sms import send_horoscope_sms, send_to_multiple as send_sms_to_multiple
from email_sender import send_horoscope_email, send_to_multiple_emails as send_email_to_multiple


def print_banner():
    """Print welcome banner"""
    print("\n" + "=" * 60)
    print("✨ POSITIVE HOROSCOPE GENERATOR ✨")
    print("=" * 60 + "\n")


def print_result(title, data):
    """Print formatted results"""
    print("\n" + "=" * 60)
    print(f"{title}")
    print("=" * 60)
    for key, value in data.items():
        print(f"{key}: {value}")
    print("=" * 60 + "\n")


def get_input(prompt, default=None):
    """Get user input with optional default"""
    if default:
        full_prompt = f"{prompt} [{default}]: "
    else:
        full_prompt = f"{prompt}: "
    
    value = input(full_prompt).strip()
    return value if value else default


def interactive_single_mode(args):
    """Interactive mode for single person horoscope"""
    print("\n📝 SINGLE PERSON HOROSCOPE")
    print("-" * 60)
    
    # Gather information
    name = get_input("Recipient's name", "Friend")
    sign = get_input("Zodiac sign", "Aries")
    
    # Optional context
    print("\nOptional: Provide context about their current situation")
    print("(Press Enter to skip)")
    context = get_input("Context", None)
    
    # Delivery channels
    print("\n📱 DELIVERY OPTIONS")
    print("-" * 60)
    
    send_sms = False
    send_email = False
    phone = None
    email = None
    
    if args.sms or args.both:
        send_sms = True
        phone = get_input("Phone number (with country code)")
    
    if args.email or args.both:
        send_email = True
        email = get_input("Email address")
    
    # If no specific channel chosen, ask
    if not send_sms and not send_email:
        choice = get_input("Send via SMS, Email, or Both? (sms/email/both)", "sms").lower()
        if choice in ["sms", "both"]:
            send_sms = True
            phone = get_input("Phone number (with country code)")
        if choice in ["email", "both"]:
            send_email = True
            email = get_input("Email address")
    
    # Generate horoscope
    print("\n⏳ Generating horoscope...")
    horoscope = generate_single_horoscope(name, sign, context)
    
    print_result("✨ GENERATED HOROSCOPE", {
        "Name": horoscope["name"],
        "Sign": horoscope["sign"],
        "Horoscope": horoscope["horoscope"],
        "Lucky Color": horoscope["lucky_color"],
        "Mantra": horoscope["mantra"],
        "Daily Focus": horoscope["daily_focus"]
    })
    
    # Send via selected channels
    if send_sms and phone:
        print("\n📱 Sending SMS...")
        result = send_horoscope_sms(
            api_username=os.getenv("VOIPMS_API_USERNAME"),
            api_password=os.getenv("VOIPMS_API_PASSWORD"),
            did=os.getenv("VOIPMS_DID"),
            dst=phone,
            horoscope_data=horoscope,
            is_couples=False
        )
        
        if result.get("success"):
            print(f"✅ SMS sent successfully to {phone}!")
            print(f"   Segments sent: {result.get('segments_sent')}")
        else:
            print(f"❌ SMS failed: {result.get('error')}")
    
    if send_email and email:
        print("\n📧 Sending email...")
        
        provider = os.getenv("EMAIL_PROVIDER", "smtp")
        
        if provider == "smtp":
            email_config = {
                "smtp_host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
                "smtp_port": int(os.getenv("SMTP_PORT", "587")),
                "smtp_user": os.getenv("SMTP_USER"),
                "smtp_password": os.getenv("SMTP_PASSWORD"),
                "from_email": os.getenv("SMTP_FROM")
            }
        elif provider == "mailgun":
            email_config = {
                "api_key": os.getenv("MAILGUN_API_KEY"),
                "domain": os.getenv("MAILGUN_DOMAIN"),
                "from_email": os.getenv("MAILGUN_FROM")
            }
        elif provider == "sendgrid":
            email_config = {
                "api_key": os.getenv("SENDGRID_API_KEY"),
                "from_email": os.getenv("SENDGRID_FROM")
            }
        else:
            print(f"❌ Unknown email provider: {provider}")
            return
        
        result = send_horoscope_email(
            provider=provider,
            to_email=email,
            horoscope_data=horoscope,
            is_couples=False,
            **email_config
        )
        
        if result.get("success"):
            print(f"✅ Email sent successfully to {email}!")
        else:
            print(f"❌ Email failed: {result.get('error')}")
    
    print("\n✨ Done!\n")


def interactive_couples_mode(args):
    """Interactive mode for couples horoscope"""
    print("\n💕 COUPLES HOROSCOPE")
    print("-" * 60)
    
    # Gather information
    print("\nPartner 1:")
    name_1 = get_input("Name")
    sign_1 = get_input("Zodiac sign")
    
    print("\nPartner 2:")
    name_2 = get_input("Name")
    sign_2 = get_input("Zodiac sign")
    
    # Optional context
    print("\nOptional: Provide context about their relationship")
    print("(e.g., 'long distance', 'planning wedding', 'new parents')")
    print("(Press Enter to skip)")
    context = get_input("Relationship context", None)
    
    # Delivery channels
    print("\n📱 DELIVERY OPTIONS")
    print("-" * 60)
    
    send_sms = False
    send_email = False
    phones = []
    emails = []
    
    if args.sms or args.both:
        send_sms = True
        phone_1 = get_input(f"{name_1}'s phone (optional)", None)
        phone_2 = get_input(f"{name_2}'s phone (optional)", None)
        phones = [p for p in [phone_1, phone_2] if p]
    
    if args.email or args.both:
        send_email = True
        email_1 = get_input(f"{name_1}'s email (optional)", None)
        email_2 = get_input(f"{name_2}'s email (optional)", None)
        emails = [e for e in [email_1, email_2] if e]
    
    # If no specific channel chosen, ask
    if not send_sms and not send_email:
        choice = get_input("Send via SMS, Email, or Both? (sms/email/both)", "sms").lower()
        if choice in ["sms", "both"]:
            send_sms = True
            phone_1 = get_input(f"{name_1}'s phone (optional)", None)
            phone_2 = get_input(f"{name_2}'s phone (optional)", None)
            phones = [p for p in [phone_1, phone_2] if p]
        if choice in ["email", "both"]:
            send_email = True
            email_1 = get_input(f"{name_1}'s email (optional)", None)
            email_2 = get_input(f"{name_2}'s email (optional)", None)
            emails = [e for e in [email_1, email_2] if e]
    
    # Generate couples horoscope
    print("\n⏳ Generating couples horoscope...")
    horoscope = generate_couples_horoscope(name_1, sign_1, name_2, sign_2, context)
    
    print_result("💕 GENERATED COUPLES HOROSCOPE", {
        "Partners": f"{horoscope['name_1']} ({horoscope['sign_1']}) & {horoscope['name_2']} ({horoscope['sign_2']})",
        "Horoscope": horoscope["couples_horoscope"],
        "Lucky Color": horoscope["lucky_color"],
        "Shared Mantra": horoscope["shared_mantra"],
        "Relationship Focus": horoscope["relationship_focus"]
    })
    
    # Send via selected channels
    if send_sms and phones:
        print(f"\n📱 Sending SMS to {len(phones)} recipient(s)...")
        result = send_sms_to_multiple(
            api_username=os.getenv("VOIPMS_API_USERNAME"),
            api_password=os.getenv("VOIPMS_API_PASSWORD"),
            did=os.getenv("VOIPMS_DID"),
            destinations=phones,
            horoscope_data=horoscope,
            is_couples=True
        )
        
        print(f"✅ Sent to {result.get('successful')}/{result.get('total_sent')} recipients")
        if result.get("failed") > 0:
            print(f"❌ {result.get('failed')} failed")
    
    if send_email and emails:
        print(f"\n📧 Sending email to {len(emails)} recipient(s)...")
        
        provider = os.getenv("EMAIL_PROVIDER", "smtp")
        
        if provider == "smtp":
            email_config = {
                "smtp_host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
                "smtp_port": int(os.getenv("SMTP_PORT", "587")),
                "smtp_user": os.getenv("SMTP_USER"),
                "smtp_password": os.getenv("SMTP_PASSWORD"),
                "from_email": os.getenv("SMTP_FROM")
            }
        elif provider == "mailgun":
            email_config = {
                "api_key": os.getenv("MAILGUN_API_KEY"),
                "domain": os.getenv("MAILGUN_DOMAIN"),
                "from_email": os.getenv("MAILGUN_FROM")
            }
        elif provider == "sendgrid":
            email_config = {
                "api_key": os.getenv("SENDGRID_API_KEY"),
                "from_email": os.getenv("SENDGRID_FROM")
            }
        else:
            print(f"❌ Unknown email provider: {provider}")
            return
        
        result = send_email_to_multiple(
            provider=provider,
            recipients=emails,
            horoscope_data=horoscope,
            is_couples=True,
            **email_config
        )
        
        print(f"✅ Sent to {result.get('successful')}/{result.get('total_sent')} recipients")
        if result.get("failed") > 0:
            print(f"❌ {result.get('failed')} failed")
    
    print("\n💕 Done!\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Generate and send positive horoscopes",
        epilog="Example: python local_send.py --sms --couple"
    )
    
    # Delivery mode flags
    parser.add_argument("--sms", action="store_true", help="Send via SMS only")
    parser.add_argument("--email", action="store_true", help="Send via Email only")
    parser.add_argument("--both", action="store_true", help="Send via both SMS and Email")
    
    # Horoscope type
    parser.add_argument("--couple", action="store_true", help="Generate couples horoscope")
    
    args = parser.parse_args()
    
    # Check environment variables
    if args.sms or args.both:
        if not os.getenv("VOIPMS_API_USERNAME") or not os.getenv("VOIPMS_API_PASSWORD"):
            print("⚠️  WARNING: VoIP.ms credentials not found in environment variables")
            print("   Set VOIPMS_API_USERNAME, VOIPMS_API_PASSWORD, and VOIPMS_DID")
            print("   SMS sending will fail without these credentials.\n")
    
    if args.email or args.both:
        provider = os.getenv("EMAIL_PROVIDER", "smtp")
        if provider == "smtp":
            if not os.getenv("SMTP_USER") or not os.getenv("SMTP_PASSWORD"):
                print("⚠️  WARNING: SMTP credentials not found in environment variables")
                print("   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM")
                print("   Email sending will fail without these credentials.\n")
        elif provider == "mailgun":
            if not os.getenv("MAILGUN_API_KEY"):
                print("⚠️  WARNING: Mailgun credentials not found")
                print("   Set MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM\n")
        elif provider == "sendgrid":
            if not os.getenv("SENDGRID_API_KEY"):
                print("⚠️  WARNING: SendGrid credentials not found")
                print("   Set SENDGRID_API_KEY, SENDGRID_FROM\n")
    
    print_banner()
    
    if args.couple:
        interactive_couples_mode(args)
    else:
        interactive_single_mode(args)


if __name__ == "__main__":
    main()
