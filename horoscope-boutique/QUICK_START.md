# 🚀 Quick Start Guide

Get your horoscope system running in 5 minutes!

---

## Option 1: Local Script (Easiest)

### Step 1: Install Python
Make sure you have Python 3.7+ installed:
```bash
python3 --version
```

### Step 2: Install Dependencies
```bash
pip install requests
```

### Step 3: Set Up Credentials
Create a `.env` file or set environment variables:
```bash
export VOIPMS_API_USERNAME="your-email@example.com"
export VOIPMS_API_PASSWORD="your-password"
export VOIPMS_DID="12025551000"
```

### Step 4: Run the Script
```bash
python local_send.py --sms
```

Follow the prompts:
- Enter recipient's name
- Enter zodiac sign
- Enter phone number
- Done! 🎉

---

## Option 2: Test Without Sending

Want to see how it works without SMS/email? Just generate horoscopes:

```bash
python generator.py
```

This will show you example single and couples horoscopes without requiring any API credentials.

---

## Option 3: Cloudflare Worker (Advanced)

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login
```bash
wrangler login
```

### Step 3: Configure
Edit `wrangler.toml` and add your Account ID.

### Step 4: Set Secrets
```bash
wrangler secret put VOIPMS_API_USERNAME
wrangler secret put VOIPMS_API_PASSWORD
wrangler secret put VOIPMS_DID
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN
wrangler secret put MAILGUN_FROM
```

### Step 5: Deploy
```bash
wrangler deploy
```

Your API is now live! 🚀

---

## Testing Your Deployment

### Test with curl

**Generate a horoscope:**
```bash
curl -X POST https://your-worker.workers.dev/horoscope \
  -H "Content-Type: application/json" \
  -d '{"name":"Emma","sign":"Pisces"}'
```

**Send via SMS:**
```bash
curl -X POST https://your-worker.workers.dev/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Emma","sign":"Pisces","phone":"+12025551234"}'
```

**Couples horoscope:**
```bash
curl -X POST https://your-worker.workers.dev/couples \
  -H "Content-Type: application/json" \
  -d '{
    "name_1":"Alex",
    "sign_1":"Leo",
    "name_2":"Jordan",
    "sign_2":"Aquarius"
  }'
```

---

## Quick Configuration Guide

### VoIP.ms (for SMS)

1. Sign up: https://voip.ms
2. Buy a phone number (DID)
3. Enable API access in settings
4. Enable SMS on your DID
5. Copy your credentials

### Gmail SMTP (for Email)

1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Google Account → Security → 2-Step Verification → App passwords
3. Use these settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

### Mailgun (for Email - Recommended)

1. Sign up: https://signup.mailgun.com/
2. Add and verify your domain
3. Get your API key from Settings → API Keys
4. Copy your domain and API key

---

## Common Commands

### Local Script

```bash
# SMS only
python local_send.py --sms

# Email only
python local_send.py --email

# Both
python local_send.py --both

# Couples mode with SMS
python local_send.py --couple --sms

# Couples mode with both
python local_send.py --couple --both
```

### Test Modules

```bash
# Test horoscope generation
python generator.py

# Test SMS formatting
python sms.py

# Test email formatting
python email.py
```

### Worker Commands

```bash
# Deploy to Cloudflare
wrangler deploy

# View logs
wrangler tail

# Test locally
wrangler dev
```

---

## Troubleshooting

### "Module not found: requests"
```bash
pip install requests
```

### "VoIP.ms API error: invalid_credentials"
- Double-check your username (should be your email)
- Verify your API password (not your account password)
- Ensure API is enabled in VoIP.ms settings

### "SMTP Authentication Error"
- For Gmail, use an App Password, not your regular password
- Verify 2FA is enabled on your Google account

### "Worker deployment failed"
- Run `wrangler login` first
- Add your `account_id` to `wrangler.toml`
- Ensure all secrets are set with `wrangler secret put`

---

## What's Next?

1. **Customize**: Edit the horoscope templates in `generator.py`
2. **Schedule**: Set up automated daily delivery
3. **Integrate**: Use the API in your own applications
4. **Extend**: Add more features or delivery channels

---

## Need Help?

1. Check the full [README.md](README.md)
2. Review [EXAMPLES.md](EXAMPLES.md) for JSON examples
3. Test each module individually
4. Verify your credentials are correct

---

## Pro Tips

- Start with test mode (generate without sending)
- Test with your own phone/email first
- Use couples mode for special occasions
- Schedule daily sends for consistent positivity
- Add context for more personalized horoscopes

---

**You're all set! Start spreading positivity! ✨**
