-- ========================================
-- HOROSCOPE BOUTIQUE - D1 DATABASE SCHEMA
-- ========================================
-- Production-ready schema for user subscriptions
-- with consent management and timezone support

-- Users Table
-- Stores all subscriber information with explicit consent tracking
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone_e164 TEXT UNIQUE,  -- E.164 format: +12025551234
    birthdate TEXT NOT NULL,  -- ISO 8601 format: YYYY-MM-DD
    zodiac_sign TEXT NOT NULL,  -- Derived from birthdate, stored for performance
    first_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',  -- IANA timezone identifier
    delivery_method TEXT NOT NULL DEFAULT 'email',  -- 'email', 'sms', or 'both'
    consent_given INTEGER NOT NULL DEFAULT 0,  -- Boolean: 0 = false, 1 = true
    consent_at TEXT,  -- ISO 8601 timestamp of when consent was given
    is_active INTEGER NOT NULL DEFAULT 1,  -- Boolean: 0 = inactive/unsubscribed, 1 = active
    last_sent_at TEXT,  -- ISO 8601 timestamp of last horoscope delivery
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_e164);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_sent ON users(last_sent_at);

-- Auth Tokens Table (optional - for magic link/OTP authentication)
CREATE TABLE IF NOT EXISTS auth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    token_type TEXT NOT NULL,  -- 'magic_link' or 'otp'
    expires_at TEXT NOT NULL,  -- ISO 8601 timestamp
    used INTEGER NOT NULL DEFAULT 0,  -- Boolean: 0 = unused, 1 = used
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON auth_tokens(expires_at);

-- Delivery Log Table (optional - for audit trail and debugging)
CREATE TABLE IF NOT EXISTS delivery_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    delivery_method TEXT NOT NULL,  -- 'email' or 'sms'
    status TEXT NOT NULL,  -- 'success', 'failed', 'skipped'
    error_message TEXT,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_user ON delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_log_sent_at ON delivery_log(sent_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
