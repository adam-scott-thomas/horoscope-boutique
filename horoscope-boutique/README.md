# ✨ Positive Horoscope Generator with SMS & Email Delivery

A complete, production-ready system for generating uplifting horoscopes and delivering them via SMS (VoIP.ms) and Email (SMTP/Mailgun/SendGrid). Includes single-person mode and couples mode with automated daily scheduling.

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Local Script](#local-script)
  - [Cloudflare Worker](#cloudflare-worker)
  - [Scheduled Delivery](#scheduled-delivery)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Features
- ✅ **Positive Horoscope Generation** - Uplifting, warm, emotionally encouraging horoscopes (120-180 words)
- ✅ **Couples Mode** - Relationship-focused horoscopes for two partners (150-220 words)
- ✅ **SMS Delivery** - Automatic message splitting via VoIP.ms API
- ✅ **Email Delivery** - Beautiful HTML emails via SMTP, Mailgun, or SendGrid
- ✅ **Multi-Channel Support** - Send via SMS, Email, or both simultaneously
- ✅ **Automated Scheduling** - Daily horoscope delivery with configurable time
- ✅ **REST API** - Full Cloudflare Worker deployment with multiple endpoints
- ✅ **Interactive CLI** - One-click local script for instant sending
- ✅ **Production Ready** - Error handling, logging, and comprehensive documentation

### Horoscope Features
- Lucky color by zodiac sign
- Daily mantra/affirmation
- Daily focus area (or relationship focus for couples)
- Context-aware generation
- Avoids: negativity, doom, betrayal, danger, illness, breakups
- Reframes challenges as opportunities

---

## 🚀 Quick Start

### 1. Clone or Download
```bash
git clone <your-repo-url>
cd horoscope-system
```

### 2. Install Dependencies
```bash
pip install requests
```

### 3. Configure Environment
```bash
# Copy example config and edit
cp .env.example .env
nano .env  # Add your API credentials
```

### 4. Run Local Script
```bash
# Interactive mode
python local_send.py --sms

# Couples mode
python local_send.py --couple --both
```

---

## 📦 Installation

### Prerequisites
- Python 3.7+ (for local scripts)
- Node.js 18+ (for Cloudflare Worker development)
- Cloudflare account (for deployment)
- VoIP.ms account with API access
- Email provider (SMTP, Mailgun, or SendGrid)

### Python Dependencies
```bash
pip install requests
```

### Node.js Dependencies (for Worker development)
```bash
npm install -g wrangler
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ========================================
# DELIVERY CONFIGURATION
# ========================================
DELIVERY_MODE=sms  # Options: sms, email, both, couple_sms, couple_email, couple_both

# ========================================
# SINGLE PERSON CONFIGURATION
# ========================================
RECIPIENT_NAME=Emma
RECIPIENT_SIGN=Pisces
RECIPIENT_PHONE=+12025551234
RECIPIENT_EMAIL=emma@example.com

# ========================================
# COUPLES CONFIGURATION
# ========================================
COUPLE_NAME_1=Alex
COUPLE_SIGN_1=Leo
COUPLE_PHONE_1=+12025551111
COUPLE_EMAIL_1=alex@example.com

COUPLE_NAME_2=Jordan
COUPLE_SIGN_2=Aquarius
COUPLE_PHONE_2=+12025552222
COUPLE_EMAIL_2=jordan@example.com

# ========================================
# VOIP.MS SMS CONFIGURATION
# ========================================
VOIPMS_API_USERNAME=your-email@example.com
VOIPMS_API_PASSWORD=your-voipms-api-password
VOIPMS_DID=12025551234

# ========================================
# EMAIL PROVIDER CONFIGURATION
# ========================================
EMAIL_PROVIDER=mailgun  # Options: smtp, mailgun, sendgrid

# SMTP Configuration (if using smtp)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Horoscope Bot <your-email@gmail.com>

# Mailgun Configuration (if using mailgun)
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=Horoscope Bot <horoscope@mg.yourdomain.com>

# SendGrid Configuration (if using sendgrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=horoscope@yourdomain.com
```

### Loading Environment Variables

For local Python scripts:
```bash
# Install python-dotenv
pip install python-dotenv

# Add to your script
from dotenv import load_dotenv
load_dotenv()
```

---

## 📖 Usage

### Local Script

The `local_send.py` script provides an interactive CLI for sending horoscopes.

#### Single Person Mode

```bash
# SMS only
python local_send.py --sms

# Email only
python local_send.py --email

# Both SMS and Email
python local_send.py --both
```

**Interactive Prompts:**
```
✨ POSITIVE HOROSCOPE GENERATOR ✨

📝 SINGLE PERSON HOROSCOPE
Recipient's name [Friend]: Emma
Zodiac sign [Aries]: Pisces
Optional: Provide context about their current situation
(Press Enter to skip)
Context: Feeling stressed about work

📱 DELIVERY OPTIONS
Phone number (with country code): +12025551234

⏳ Generating horoscope...
✅ SMS sent successfully to +12025551234!
```

#### Couples Mode

```bash
# SMS to both partners
python local_send.py --couple --sms

# Email to both partners
python local_send.py --couple --email

# Both channels to both partners
python local_send.py --couple --both
```

**Interactive Prompts:**
```
💕 COUPLES HOROSCOPE

Partner 1:
Name: Alex
Zodiac sign: Leo

Partner 2:
Name: Jordan
Zodiac sign: Aquarius

Optional: Provide context about their relationship
Relationship context: Long distance, planning to reunite soon

📱 DELIVERY OPTIONS
Alex's phone (optional): +12025551111
Jordan's phone (optional): +12025552222

⏳ Generating couples horoscope...
✅ Sent to 2/2 recipients
```

---

## 🌐 Cloudflare Worker

### Deployment

#### 1. Install Wrangler
```bash
npm install -g wrangler
```

#### 2. Login to Cloudflare
```bash
wrangler login
```

#### 3. Update wrangler.toml
Edit `wrangler.toml` and add your Account ID:
```toml
account_id = "your-account-id-here"
```

Find your Account ID at: https://dash.cloudflare.com/ → Your Account → Account ID

#### 4. Set Secrets
```bash
# VoIP.ms credentials
wrangler secret put VOIPMS_API_USERNAME
wrangler secret put VOIPMS_API_PASSWORD
wrangler secret put VOIPMS_DID

# Recipients
wrangler secret put RECIPIENT_PHONE
wrangler secret put RECIPIENT_EMAIL

# Email provider (example for Mailgun)
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN
wrangler secret put MAILGUN_FROM

# Couples mode (if needed)
wrangler secret put COUPLE_PHONE_1
wrangler secret put COUPLE_PHONE_2
wrangler secret put COUPLE_EMAIL_1
wrangler secret put COUPLE_EMAIL_2
```

#### 5. Configure Delivery Mode
Edit the `[vars]` section in `wrangler.toml`:
```toml
[vars]
DELIVERY_MODE = "both"  # sms, email, both, couple_sms, couple_email, couple_both
EMAIL_PROVIDER = "mailgun"  # smtp, mailgun, sendgrid
RECIPIENT_NAME = "Emma"
RECIPIENT_SIGN = "Pisces"
```

#### 6. Deploy
```bash
wrangler deploy
```

Your Worker will be deployed to: `https://horoscope-generator.<your-subdomain>.workers.dev`

---

## 📡 API Reference

### Endpoints

#### POST /horoscope
Generate a single person horoscope.

**Request:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "context": "Feeling stressed about work" // optional
}
```

**Response:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "horoscope": "Dear Emma, today's cosmic energy brings...",
  "lucky_color": "Aquamarine",
  "mantra": "I embrace growth with an open heart",
  "daily_focus": "Self-care",
  "generated_at": "2024-01-15T10:00:00.000Z"
}
```

#### POST /couples
Generate a couples horoscope.

**Request:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "context": "Planning wedding" // optional
}
```

**Response:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "couples_horoscope": "Alex and Jordan, your combined energy...",
  "lucky_color": "Purple",
  "shared_mantra": "Together, we are stronger",
  "relationship_focus": "Communication",
  "generated_at": "2024-01-15T10:00:00.000Z"
}
```

#### POST /send
Generate and send single horoscope via SMS.

**Request:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "phone": "+12025551234",
  "context": "Optional context"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": { ... },
  "sms_result": {
    "status": "success",
    "sms": "12345"
  }
}
```

#### POST /email
Generate and send single horoscope via email.

**Request:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "email": "emma@example.com",
  "context": "Optional context"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": { ... },
  "email_result": {
    "success": true,
    "provider": "mailgun",
    "message_id": "xxxxx"
  }
}
```

#### POST /couples/send
Generate and send couples horoscope via SMS and/or email.

**Request:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "phone_1": "+12025551111",  // optional
  "phone_2": "+12025552222",  // optional
  "email_1": "alex@example.com",  // optional
  "email_2": "jordan@example.com",  // optional
  "context": "Long distance"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": { ... },
  "sms_results": [
    { "phone": "+12025551111", "result": { "status": "success" } },
    { "phone": "+12025552222", "result": { "status": "success" } }
  ],
  "email_results": [
    { "email": "alex@example.com", "result": { "success": true } },
    { "email": "jordan@example.com", "result": { "success": true } }
  ]
}
```

---

## 📅 Scheduled Delivery

### Cloudflare Worker Cron

The Worker automatically sends horoscopes based on the configured schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["0 14 * * *"]  # 9 AM Eastern = 14:00 UTC
```

**Cron Syntax:** `minute hour day month day-of-week`

**Common Schedules:**
- Every day at 9 AM EST: `0 14 * * *` (14:00 UTC)
- Every day at 8 AM EST: `0 13 * * *`
- Every Monday at 9 AM EST: `0 14 * * 1`
- Twice daily (9 AM and 6 PM EST): `0 14,23 * * *`

### Python Cron (Linux/Mac)

#### Using crontab

1. Open crontab:
```bash
crontab -e
```

2. Add schedule:
```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/horoscope-system && /usr/bin/python3 scheduler.py

# Run daily at 9 AM with logging
0 9 * * * cd /path/to/horoscope-system && /usr/bin/python3 scheduler.py >> /var/log/horoscope.log 2>&1
```

3. Save and exit

#### Using systemd timer (Linux)

Create `/etc/systemd/system/horoscope.service`:
```ini
[Unit]
Description=Daily Horoscope Delivery
After=network.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/horoscope-system
ExecStart=/usr/bin/python3 scheduler.py
Environment="PATH=/usr/bin"

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/horoscope.timer`:
```ini
[Unit]
Description=Daily Horoscope Timer
Requires=horoscope.service

[Timer]
OnCalendar=09:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable horoscope.timer
sudo systemctl start horoscope.timer
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Daily Horoscope"
4. Trigger: Daily at 9:00 AM
5. Action: Start a program
   - Program: `python.exe`
   - Arguments: `C:\path\to\horoscope-system\scheduler.py`
   - Start in: `C:\path\to\horoscope-system`
6. Finish

---

## 💡 Examples

### Example 1: Quick SMS Test
```bash
python local_send.py --sms
# Enter: name=Emma, sign=Pisces, phone=+12025551234
```

### Example 2: Couples Horoscope to Both Emails
```bash
python local_send.py --couple --email
# Enter both partners' info and emails
```

### Example 3: API Call with curl
```bash
# Generate horoscope
curl -X POST https://your-worker.workers.dev/horoscope \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emma",
    "sign": "Pisces",
    "context": "Starting new job"
  }'

# Send via SMS
curl -X POST https://your-worker.workers.dev/send \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emma",
    "sign": "Pisces",
    "phone": "+12025551234"
  }'
```

### Example 4: Python Script Integration
```python
from generator import generate_single_horoscope
from sms import send_horoscope_sms

# Generate
horoscope = generate_single_horoscope("Emma", "Pisces")
print(horoscope["horoscope"])

# Send via SMS
result = send_horoscope_sms(
    api_username="user@example.com",
    api_password="password",
    did="12025551000",
    dst="+12025551234",
    horoscope_data=horoscope
)
print(f"Sent: {result['success']}")
```

---

## 🔧 Provider Setup Guides

### VoIP.ms Setup

1. **Create Account**: Go to https://voip.ms and sign up
2. **Purchase DID**: Get a phone number (DID) for sending SMS
3. **Enable API**:
   - Login → Main Menu → API
   - Enable API Access
   - Note your API credentials (username = email, generate password)
4. **Enable SMS**: 
   - Go to DID Numbers
   - Click on your DID
   - Enable SMS
5. **Test**:
```bash
curl "https://voip.ms/api/v1/rest.php?api_username=YOUR_EMAIL&api_password=YOUR_PASSWORD&method=sendSMS&did=YOUR_DID&dst=TEST_NUMBER&message=Test"
```

### SMTP Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Select "Mail" → Generate
3. **Configure**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Horoscope Bot <your-email@gmail.com>
```

### Mailgun Setup

1. **Sign Up**: https://signup.mailgun.com/new/signup
2. **Add Domain**: 
   - Sending → Domains → Add New Domain
   - Follow DNS setup instructions
3. **Get API Key**:
   - Settings → API Keys
   - Copy Private API Key
4. **Configure**:
```bash
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=Horoscope Bot <horoscope@mg.yourdomain.com>
```

### SendGrid Setup

1. **Sign Up**: https://signup.sendgrid.com/
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Choose "Full Access" or "Mail Send" only
3. **Verify Sender**:
   - Settings → Sender Authentication
   - Verify a Single Sender
4. **Configure**:
```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM=horoscope@yourdomain.com
```

---

## 🐛 Troubleshooting

### SMS Issues

**Problem**: "VoIP.ms API error: invalid_credentials"
```bash
# Check credentials
echo $VOIPMS_API_USERNAME
echo $VOIPMS_API_PASSWORD

# Test API directly
curl "https://voip.ms/api/v1/rest.php?api_username=YOUR_EMAIL&api_password=YOUR_PASSWORD&method=getBalance"
```

**Problem**: Message not delivering
- Verify DID has SMS enabled in VoIP.ms dashboard
- Check destination number format (+1 for US/Canada)
- Verify account has SMS credits

### Email Issues

**Problem**: "SMTP Authentication Error"
```bash
# For Gmail, use App Password not regular password
# For other providers, check SMTP settings and credentials
```

**Problem**: Emails going to spam
- Set up SPF, DKIM, DMARC records for your domain
- Use a verified sender address
- Avoid spammy content in subject/body

### Cloudflare Worker Issues

**Problem**: "Error 1101: Worker threw exception"
```bash
# Check Worker logs
wrangler tail

# Verify all secrets are set
wrangler secret list
```

**Problem**: Scheduled trigger not running
```bash
# Check cron trigger configuration in wrangler.toml
# View scheduled runs in Cloudflare dashboard
# Workers → Your Worker → Triggers → Cron Triggers
```

### Python Module Issues

**Problem**: "ModuleNotFoundError: No module named 'requests'"
```bash
pip install requests
```

**Problem**: Import errors with email module
```bash
# Our email.py might conflict with built-in email module
# Make sure you're in the project directory when running scripts
cd /path/to/horoscope-system
python local_send.py
```

---

## 📄 File Structure

```
horoscope-system/
├── generator.py          # Horoscope generation logic
├── sms.py               # VoIP.ms SMS integration
├── email_sender.py      # Email sending (SMTP/Mailgun/SendGrid)
├── scheduler.py         # Automated scheduling logic
├── local_send.py        # Interactive CLI script
├── worker.js            # Cloudflare Worker
├── wrangler.toml        # Worker configuration
├── README.md            # This file
├── .env.example         # Example environment variables
└── .env                 # Your secrets (DO NOT COMMIT)
```

---

## 🎯 Project Goals

This system is designed to:
- ✅ Be production-ready out of the box
- ✅ Require zero coding knowledge to use
- ✅ Support multiple delivery channels
- ✅ Handle errors gracefully
- ✅ Scale easily (via Cloudflare Workers)
- ✅ Be completely customizable
- ✅ Spread positivity and joy

---

## 📝 License

This project is provided as-is for personal and commercial use.

---

## 🤝 Support

For issues, questions, or feature requests:
1. Check this README thoroughly
2. Review the troubleshooting section
3. Examine the code comments
4. Test with example configurations

---

**Made with ❤️ to spread daily positivity**

✨ May your horoscopes always bring joy! ✨
