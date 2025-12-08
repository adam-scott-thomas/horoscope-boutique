# ✨ Horoscope Boutique

> **Production-ready horoscope subscription service built on Cloudflare infrastructure**

A complete, scalable system for delivering personalized daily horoscopes via email and SMS. Users sign up with their birthday, and automatically receive uplifting horoscopes at 9 AM in their local timezone.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![D1 Database](https://img.shields.io/badge/Database-D1-f38020?logo=cloudflare)](https://developers.cloudflare.com/d1/)

---

## 🌟 Features

### Core Features

- ✅ **Automatic Zodiac Calculation** - Derives zodiac sign from birthday (server-side, no client trust)
- ✅ **Timezone-Aware Delivery** - Sends at 9 AM in user's local timezone
- ✅ **Multi-Channel Delivery** - Email, SMS, or both
- ✅ **One-Send-Per-Day Enforcement** - Prevents duplicate sends
- ✅ **Explicit Consent Management** - GDPR/TCPA compliant
- ✅ **Easy Unsubscribe** - One-click via email link or SMS reply
- ✅ **Mobile-Friendly UI** - Clean, minimal signup form
- ✅ **E.164 Phone Validation** - Automatic normalization
- ✅ **Scheduled Cron** - Hourly checks for delivery
- ✅ **Production Ready** - Error handling, retry logic, logging

### User Experience

- **Immediate Delivery**: First horoscope sent upon signup
- **Personalized Content**: Uses first name and zodiac sign
- **Positive Messaging**: Uplifting, never negative
- **Beautiful Emails**: Responsive HTML design
- **Concise SMS**: Optimized for mobile

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Cloudflare Pages | Landing page, signup form |
| **Backend API** | Cloudflare Workers | REST API endpoints |
| **Database** | Cloudflare D1 (SQLite) | User data, delivery logs |
| **Scheduling** | Cron Triggers | Hourly delivery checks |
| **Email** | Mailgun API | Email delivery |
| **SMS** | VoIP.ms API | SMS delivery |

### System Flow

```
┌─────────────┐
│   User      │
│  Visits     │
│  Website    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Cloudflare     │
│    Pages        │◄── index.html, style.css, script.js
│   (Frontend)    │
└────────┬────────┘
         │ POST /api/signup
         ▼
┌──────────────────┐
│  Cloudflare      │
│   Workers        │◄── src/worker.js (API)
│  (Backend API)   │
└────────┬─────────┘
         │
         ├─────────► D1 Database (Store user)
         │
         └─────────► Send immediate horoscope
                       │
                       ├─► Email (Mailgun)
                       └─► SMS (VoIP.ms)

┌──────────────────┐
│  Cron Trigger    │
│  (Every Hour)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Check all users │
│  Is it 9 AM      │
│  in their TZ?    │
└────────┬─────────┘
         │ Yes
         ▼
┌──────────────────┐
│  Send horoscope  │
│  Update last_    │
│  sent_at         │
└──────────────────┘
```

---

## 📁 Project Structure

```
horoscope-boutique/
├── public/                     # Frontend (Cloudflare Pages)
│   ├── index.html             # Landing page with signup form
│   ├── style.css              # Responsive styling
│   └── script.js              # Form handling, timezone detection
│
├── src/                       # Backend (Cloudflare Workers)
│   ├── worker.js              # Main API handler + cron
│   ├── zodiac.js              # Zodiac sign calculation
│   ├── horoscope.js           # Content generation
│   ├── email.js               # Mailgun integration
│   ├── sms.js                 # VoIP.ms integration
│   └── utils.js               # Validation, date helpers
│
├── schema.sql                 # D1 database schema
├── wrangler.toml              # Cloudflare configuration
├── package.json               # Dependencies & scripts
│
├── README.md                  # This file
├── DEPLOYMENT.md              # Step-by-step deployment guide
└── SCALING_AND_COMPLIANCE.md  # Scaling & legal compliance
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free)
- Mailgun account (5,000 free emails/month)
- VoIP.ms account (for SMS)

### 1. Install Dependencies

```bash
git clone <your-repo>
cd horoscope-boutique
npm install
```

### 2. Configure Cloudflare

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Create D1 database
wrangler d1 create horoscope-boutique-db

# Initialize schema
wrangler d1 execute horoscope-boutique-db --file=./schema.sql
```

### 3. Set Secrets

```bash
# Mailgun
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN
wrangler secret put MAILGUN_FROM

# VoIP.ms
wrangler secret put VOIPMS_API_USERNAME
wrangler secret put VOIPMS_API_PASSWORD
wrangler secret put VOIPMS_DID
```

### 4. Deploy

```bash
# Deploy Worker (API)
npm run deploy

# Deploy Pages (Frontend)
npm run pages:deploy
```

### 5. Test

Visit your deployed URL and sign up!

**For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 📡 API Reference

### Endpoints

#### POST /api/signup

Register for daily horoscopes.

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+12025551234",
  "birthdate": "1990-06-15",
  "first_name": "Alex",
  "timezone": "America/New_York",
  "delivery_method": "both",
  "consent_given": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "zodiac_sign": "Gemini",
    "timezone": "America/New_York",
    "delivery_method": "both"
  },
  "immediate_delivery": {
    "email": { "success": true, "message_id": "xxx" },
    "sms": { "success": true, "parts_sent": 2 }
  }
}
```

#### POST /api/request

Manually request today's horoscope (once per day).

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Horoscope sent successfully"
}
```

#### POST /api/unsubscribe

Unsubscribe from daily horoscopes.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### GET /api/unsubscribe?email=xxx

Unsubscribe via email link (HTML response).

---

## 🗄️ Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `email` | TEXT | Email address (unique) |
| `phone_e164` | TEXT | Phone in E.164 format |
| `birthdate` | TEXT | ISO 8601 date (YYYY-MM-DD) |
| `zodiac_sign` | TEXT | Calculated zodiac sign |
| `first_name` | TEXT | Optional first name |
| `timezone` | TEXT | IANA timezone identifier |
| `delivery_method` | TEXT | "email", "sms", or "both" |
| `consent_given` | INTEGER | Boolean (0 or 1) |
| `consent_at` | TEXT | ISO 8601 timestamp |
| `is_active` | INTEGER | Boolean (0 = unsubscribed) |
| `last_sent_at` | TEXT | Last delivery timestamp |
| `created_at` | TEXT | Account creation timestamp |
| `updated_at` | TEXT | Last update timestamp |

### Delivery Log Table

Tracks all delivery attempts for debugging and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | Foreign key to users |
| `delivery_method` | TEXT | "email" or "sms" |
| `status` | TEXT | "success", "failed", "skipped" |
| `error_message` | TEXT | Error details if failed |
| `sent_at` | TEXT | Timestamp |

---

## ⚙️ Configuration

### Environment Variables

Set via `wrangler secret put`:

| Variable | Required | Description |
|----------|----------|-------------|
| `MAILGUN_API_KEY` | Yes | Mailgun private API key |
| `MAILGUN_DOMAIN` | Yes | Mailgun domain (e.g., mg.horoscope.boutique) |
| `MAILGUN_FROM` | Yes | From address (e.g., "Horoscope Boutique <daily@...>") |
| `VOIPMS_API_USERNAME` | Yes | VoIP.ms email |
| `VOIPMS_API_PASSWORD` | Yes | VoIP.ms API password |
| `VOIPMS_DID` | Yes | VoIP.ms phone number (without +) |

### Cron Schedule

**Current:** `0 * * * *` (every hour)

**Why hourly?** Users in different timezones hit 9 AM at different UTC times. The system checks each user's local time and sends when it's 9 AM for them.

**To change delivery time:**
Edit the schedule logic in `src/worker.js`:
```javascript
// Change from hour === 9 to hour === 8 for 8 AM delivery
if (localTime.hour === 9) {
  // send horoscope
}
```

---

## 🔒 Security & Compliance

### Security Features

- ✅ All API keys stored as Cloudflare secrets (encrypted)
- ✅ SQL injection prevention via prepared statements
- ✅ Input validation (email, phone, birthdate)
- ✅ HTTPS enforced (Cloudflare default)
- ✅ No client-side zodiac calculation (prevents spoofing)

### Compliance

- **GDPR** (EU): Explicit consent, easy data deletion, unsubscribe
- **TCPA** (US SMS): Written consent, opt-out mechanism, time restrictions
- **CAN-SPAM** (US Email): Unsubscribe link, physical address, accurate headers
- **CASL** (Canada): Express consent, sender identification

**See [SCALING_AND_COMPLIANCE.md](./SCALING_AND_COMPLIANCE.md) for details**

---

## 📈 Scaling

### Current Capacity

- **Users**: 10,000-50,000 on free tier
- **Requests**: 100,000/day (Workers free tier)
- **Database**: 5GB, 5M reads/day, 100K writes/day

### Scaling Path

1. **0-10K users**: Free tier, no changes needed
2. **10K-100K users**: Upgrade to Workers Paid ($5/month), add indexes
3. **100K-1M users**: Implement queues, multi-region deployment
4. **1M+ users**: Durable Objects, advanced analytics, multiple databases

**See [SCALING_AND_COMPLIANCE.md](./SCALING_AND_COMPLIANCE.md) for detailed strategies**

---

## 💰 Cost Estimates

### Free Tier (0-10,000 users)

- **Cloudflare**: $0 (Workers, Pages, D1 free tiers)
- **Mailgun**: $0 (5,000 emails/month free for 3 months)
- **VoIP.ms**: ~$10/month (SMS at $0.01 each)

**Total**: $10-20/month

### Paid Tier (10,000-100,000 users)

- **Cloudflare Workers**: $5/month (Paid plan)
- **Cloudflare D1**: $5/month (beyond free tier)
- **Mailgun**: $35/month (50,000 emails)
- **VoIP.ms**: $100/month (10,000 SMS)

**Total**: $145/month

---

## 🛠️ Development

### Run Locally

```bash
# Start Worker dev server
npm run dev

# Visit http://localhost:8787
```

### Run Frontend Locally

```bash
# Start Pages dev server
npm run pages:dev

# Visit http://localhost:8788
```

### Test Database

```bash
# Query users
wrangler d1 execute horoscope-boutique-db --command "SELECT * FROM users LIMIT 10"

# Check delivery log
wrangler d1 execute horoscope-boutique-db --command "SELECT * FROM delivery_log ORDER BY sent_at DESC LIMIT 10"
```

### View Logs

```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error
```

---

## 🐛 Troubleshooting

### Worker Errors

```bash
# Check logs
wrangler tail --status error

# Test endpoint
curl -X POST https://your-worker.workers.dev/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", ...}'
```

### Email Not Sending

1. Verify Mailgun API key: `wrangler secret list`
2. Check Mailgun logs: https://app.mailgun.com/logs
3. Verify domain is verified
4. Check sender address is authorized

### SMS Not Sending

1. Test VoIP.ms API directly:
   ```bash
   curl "https://voip.ms/api/v1/rest.php?api_username=EMAIL&api_password=PASS&method=getBalance"
   ```
2. Check DID has SMS enabled
3. Verify phone number format (E.164)
4. Check account balance

### Cron Not Running

1. Check trigger: Dashboard → Worker → Triggers → Cron Triggers
2. View logs during expected run time
3. Manually test scheduled handler in dashboard

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[SCALING_AND_COMPLIANCE.md](./SCALING_AND_COMPLIANCE.md)** - Scaling strategies & legal compliance

---

## 🗺️ Roadmap

### Phase 1: Launch ✅
- [x] Core subscription system
- [x] Email & SMS delivery
- [x] Timezone-aware scheduling
- [x] Frontend signup form
- [x] Deployment documentation

### Phase 2: Growth 🚧
- [ ] Analytics dashboard
- [ ] A/B testing for horoscope templates
- [ ] Referral system
- [ ] Premium features (detailed readings)

### Phase 3: Scale 📅
- [ ] Multi-region deployment
- [ ] Queue system for high-volume
- [ ] Advanced personalization (ML-based)
- [ ] Mobile app (iOS/Android)

---

## 🤝 Contributing

This is a production-ready template. Feel free to:

1. Fork the repository
2. Customize horoscope content
3. Add new features
4. Submit pull requests

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🙏 Acknowledgments

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Mailgun](https://www.mailgun.com/)
- [VoIP.ms](https://voip.ms/)

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
2. Review [SCALING_AND_COMPLIANCE.md](./SCALING_AND_COMPLIANCE.md)
3. Check code comments in `src/worker.js`
4. Open an issue on GitHub

---

**Made with ❤️ and cosmic energy**

✨ **May your horoscopes bring joy to thousands!** ✨

---

## 🌟 Live Demo

Once deployed, your site will be live at:
- **Production**: https://horoscope.boutique
- **API**: https://horoscope.boutique/api

Sign up and receive your first horoscope instantly!
