# 🚀 Horoscope Boutique - Deployment Guide

Complete step-by-step guide to deploy your production-ready horoscope subscription service to Cloudflare.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Domain name: `horoscope.boutique` (or your custom domain)
- VoIP.ms account (for SMS) or alternative SMS provider
- Mailgun account (for email) or alternative email provider

---

## 🏗️ Project Structure

```
horoscope-boutique/
├── public/              # Frontend (Cloudflare Pages)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── src/                 # Backend (Cloudflare Workers)
│   ├── worker.js        # Main API handler
│   ├── zodiac.js        # Zodiac calculation
│   ├── horoscope.js     # Content generation
│   ├── email.js         # Email service
│   ├── sms.js           # SMS service
│   └── utils.js         # Utilities
├── schema.sql           # D1 database schema
├── wrangler.toml        # Cloudflare configuration
├── package.json
└── DEPLOYMENT.md        # This file
```

---

## 📦 Step 1: Install Dependencies

```bash
cd horoscope-boutique
npm install
```

---

## 🔐 Step 2: Cloudflare Setup

### 2.1 Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2.2 Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### 2.3 Get Your Account ID

Visit https://dash.cloudflare.com/ → Select your account → Copy Account ID from the sidebar.

Update `wrangler.toml`:
```toml
account_id = "your-account-id-here"
```

---

## 💾 Step 3: Create D1 Database

### 3.1 Create Database

```bash
wrangler d1 create horoscope-boutique-db
```

This will output:
```
✅ Successfully created DB 'horoscope-boutique-db'
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3.2 Update wrangler.toml

Copy the Database ID and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "horoscope-boutique-db"
database_id = "your-database-id-here"  # Replace with your ID
```

### 3.3 Initialize Database Schema

```bash
wrangler d1 execute horoscope-boutique-db --file=./schema.sql
```

### 3.4 Verify Database

```bash
wrangler d1 execute horoscope-boutique-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `users`, `auth_tokens`, `delivery_log`

---

## 📧 Step 4: Configure Mailgun (Email Provider)

### 4.1 Sign Up for Mailgun

1. Go to https://signup.mailgun.com/new/signup
2. Create a free account (5,000 emails/month free)

### 4.2 Add and Verify Domain

1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter your domain or subdomain: `mg.horoscope.boutique`
3. Follow DNS setup instructions:
   - Add TXT records for domain verification
   - Add MX records for receiving
   - Add CNAME records for tracking (optional)
4. Wait for verification (can take a few minutes to 24 hours)

### 4.3 Get API Credentials

1. Go to **Settings** → **API Keys**
2. Copy your **Private API Key**

### 4.4 Set Cloudflare Secrets

```bash
wrangler secret put MAILGUN_API_KEY
# Paste your Mailgun API key when prompted

wrangler secret put MAILGUN_DOMAIN
# Enter: mg.horoscope.boutique

wrangler secret put MAILGUN_FROM
# Enter: Horoscope Boutique <daily@horoscope.boutique>
```

---

## 📱 Step 5: Configure VoIP.ms (SMS Provider)

### 5.1 Sign Up for VoIP.ms

1. Go to https://voip.ms and create an account
2. Add funds to your account ($25 minimum)

### 5.2 Purchase a DID (Phone Number)

1. Go to **DID Numbers** → **Order DID**
2. Select location and purchase a number
3. Enable SMS for the DID:
   - Click on your DID
   - Enable **SMS**
   - Set SMS routing if needed

### 5.3 Enable API Access

1. Go to **Main Menu** → **API**
2. Enable **API Access**
3. Create API password

### 5.4 Set Cloudflare Secrets

```bash
wrangler secret put VOIPMS_API_USERNAME
# Enter your VoIP.ms email

wrangler secret put VOIPMS_API_PASSWORD
# Enter your API password

wrangler secret put VOIPMS_DID
# Enter your DID (phone number) without + or dashes
# Example: 12025551234
```

### 5.5 Test SMS (Optional)

```bash
curl "https://voip.ms/api/v1/rest.php?api_username=YOUR_EMAIL&api_password=YOUR_PASSWORD&method=sendSMS&did=YOUR_DID&dst=YOUR_PHONE&message=Test"
```

---

## 🚀 Step 6: Deploy Worker (API)

### 6.1 Test Locally

```bash
npm run dev
```

Visit http://localhost:8787 to test the API.

### 6.2 Deploy to Production

```bash
npm run deploy
```

Your Worker will be deployed to:
```
https://horoscope-boutique.YOUR-SUBDOMAIN.workers.dev
```

### 6.3 Test API Endpoints

```bash
# Test API info
curl https://horoscope-boutique.YOUR-SUBDOMAIN.workers.dev/api

# Test signup (replace with real data)
curl -X POST https://horoscope-boutique.YOUR-SUBDOMAIN.workers.dev/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+12025551234",
    "birthdate": "1990-06-15",
    "first_name": "Test",
    "timezone": "America/New_York",
    "delivery_method": "email",
    "consent_given": true
  }'
```

---

## 🌐 Step 7: Deploy Frontend (Cloudflare Pages)

### 7.1 Create Pages Project

```bash
npm run pages:deploy
```

Or manually:
1. Go to https://dash.cloudflare.com/ → **Workers & Pages** → **Create application** → **Pages**
2. Connect your Git repository (GitHub/GitLab)
3. Build settings:
   - Build command: (leave empty)
   - Build output directory: `public`
4. Deploy

### 7.2 Connect Custom Domain

1. In Pages project settings → **Custom domains**
2. Add `horoscope.boutique`
3. Follow DNS instructions (usually automatic if domain is on Cloudflare)

### 7.3 Configure Functions (API Integration)

Cloudflare Pages automatically routes `/api/*` requests to your Worker if they're in the same project.

Alternatively, create a `_routes.json` in `public/`:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

---

## ⏱️ Step 8: Verify Cron Schedule

### 8.1 Check Cron Trigger

Go to **Workers & Pages** → **horoscope-boutique** → **Triggers** → **Cron Triggers**

You should see: `0 * * * *` (runs hourly)

### 8.2 Monitor Cron Execution

```bash
# Watch real-time logs
wrangler tail

# Or check in dashboard
# Workers & Pages → horoscope-boutique → Logs
```

### 8.3 Test Cron Manually

In Cloudflare dashboard:
1. Go to your Worker
2. Click **Quick Edit** or **Send Request**
3. Manually trigger the scheduled event

---

## 🔍 Step 9: Testing

### 9.1 Test Complete Flow

1. Visit `https://horoscope.boutique`
2. Fill out signup form
3. Check email/SMS for immediate horoscope
4. Wait until next day at 9 AM to verify scheduled delivery

### 9.2 Test Database Queries

```bash
# View all users
wrangler d1 execute horoscope-boutique-db --command "SELECT * FROM users"

# View delivery log
wrangler d1 execute horoscope-boutique-db --command "SELECT * FROM delivery_log ORDER BY sent_at DESC LIMIT 10"

# Check active users
wrangler d1 execute horoscope-boutique-db --command "SELECT COUNT(*) as active_users FROM users WHERE is_active = 1"
```

### 9.3 Test Unsubscribe

```bash
curl -X POST https://horoscope.boutique/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Or visit: `https://horoscope.boutique/api/unsubscribe?email=test@example.com`

---

## 📊 Step 10: Monitoring & Maintenance

### 10.1 Check Worker Analytics

Dashboard → Workers & Pages → horoscope-boutique → **Analytics**

Monitor:
- Request count
- Error rate
- CPU time
- Bandwidth

### 10.2 Set Up Alerts (Optional)

Dashboard → **Notifications** → Create notification policy for:
- Worker errors
- High error rate
- Unusual traffic

### 10.3 View Logs

```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

### 10.4 Database Maintenance

```bash
# Backup database (export all tables)
wrangler d1 execute horoscope-boutique-db --command "SELECT * FROM users" --json > backup_users.json

# Clean old delivery logs (older than 30 days)
wrangler d1 execute horoscope-boutique-db --command "DELETE FROM delivery_log WHERE sent_at < datetime('now', '-30 days')"
```

---

## 🔄 Updating the Application

### Update Worker Code

```bash
# Make changes to src/*.js
# Then deploy
npm run deploy
```

### Update Frontend

```bash
# Make changes to public/*
# Then deploy
npm run pages:deploy
```

### Update Database Schema

```bash
# Make changes to schema.sql
# Then execute new migrations
wrangler d1 execute horoscope-boutique-db --file=./schema.sql
```

---

## 🐛 Troubleshooting

### Worker Errors

```bash
# Check logs
wrangler tail

# Check specific error
wrangler tail --status error
```

### Database Issues

```bash
# Test database connection
wrangler d1 execute horoscope-boutique-db --command "SELECT 1"

# Check table structure
wrangler d1 execute horoscope-boutique-db --command "PRAGMA table_info(users)"
```

### Email Not Sending

1. Verify Mailgun API key: Check secrets with `wrangler secret list`
2. Check Mailgun dashboard for error logs
3. Verify domain is verified in Mailgun
4. Check sender email is authorized

### SMS Not Sending

1. Verify VoIP.ms credentials
2. Check VoIP.ms account balance
3. Verify DID has SMS enabled
4. Test API directly with curl (see Step 5.5)

### Cron Not Running

1. Check trigger is set: Dashboard → Worker → Triggers → Cron Triggers
2. Verify syntax: `0 * * * *` for hourly
3. Check logs during expected run time
4. Ensure users have valid timezones

---

## 💰 Cost Estimates

### Cloudflare

- **Workers**: Free tier includes 100,000 requests/day
- **Pages**: Free tier includes 500 builds/month
- **D1**: Free tier includes 5GB storage, 5M reads/day, 100k writes/day
- **Expected cost**: $0-5/month (depending on user count)

### Mailgun

- **Free tier**: 5,000 emails/month for 3 months, then $0.80/1000 emails
- **Expected cost**: $0-10/month for 10k users

### VoIP.ms

- **SMS**: ~$0.01 per SMS (varies by country)
- **Expected cost**: $10-100/month depending on SMS volume

**Total estimated cost for 10,000 users**: $10-115/month

---

## 📈 Scaling Considerations

### Performance

- **D1 database** can handle millions of rows
- **Workers** autoscale automatically
- **Cron** runs in parallel for all users (within reason)

### Rate Limits

- **Mailgun**: Rate limited to ~100 emails/second
- **VoIP.ms**: Rate limited to ~10 SMS/second
- **Solution**: Implement batch sending with delays if needed

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_timezone ON users(timezone);
CREATE INDEX idx_users_last_sent ON users(last_sent_at, is_active);
```

### Horizontal Scaling

- Consider splitting users by region/timezone
- Use multiple Workers for different regions
- Implement queue system for high-volume sends

---

## 🔒 Security & Compliance

### Data Protection

- All secrets stored in Cloudflare (encrypted at rest)
- HTTPS enforced for all connections
- SQL injection prevented via prepared statements

### GDPR Compliance

- Explicit consent required (checkbox)
- Consent timestamp recorded
- Easy unsubscribe mechanism
- Data deletion on request (manual for now)

### Spam Prevention

- One-send-per-day enforcement
- Unsubscribe link in every email
- "STOP" keyword support for SMS

---

## 🎉 You're Done!

Your horoscope subscription service is now live at:
- **Frontend**: https://horoscope.boutique
- **API**: https://horoscope.boutique/api

Monitor your first users and scheduled deliveries. Good luck! ✨

---

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Mailgun API Docs](https://documentation.mailgun.com/en/latest/api-intro.html)
- [VoIP.ms API Docs](https://voip.ms/m/apidocs.php)

---

**Need help?** Check the troubleshooting section or review the code comments in `src/worker.js`.
