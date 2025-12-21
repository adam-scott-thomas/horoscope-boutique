-- Schema update for GPT-4 horoscope system
-- Run with: wrangler d1 execute horoscope-boutique --file=./schema-update.sql --remote

-- Add new columns to users table for tracking
ALTER TABLE users ADD COLUMN spicy_allowed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_reframe_pattern TEXT;
ALTER TABLE users ADD COLUMN last_spicy_at TEXT;
ALTER TABLE users ADD COLUMN morning_had_friction INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_morning_sent_at TEXT;
ALTER TABLE users ADD COLUMN last_evening_sent_at TEXT;

-- Message history table for anti-repetition
CREATE TABLE IF NOT EXISTS message_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message_type TEXT NOT NULL,  -- 'morning' or 'evening'
    reframe_pattern TEXT NOT NULL,  -- 'A', 'B', 'C', 'D'
    had_friction INTEGER NOT NULL DEFAULT 0,
    spicy_used INTEGER NOT NULL DEFAULT 0,
    subject TEXT,
    content_hash TEXT,  -- For detecting similar content
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_user ON message_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_sent ON message_history(sent_at);
