import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/worker.js';

// Test utilities
const createRequest = (path, options = {}) => {
  const url = `https://horoscope.boutique${path}`;
  return new Request(url, {
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://horoscope.boutique',
      ...options.headers,
    },
    ...options,
  });
};

const createJsonRequest = (path, body) => {
  return createRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

describe('Horoscope Boutique API', () => {
  beforeAll(async () => {
    // Set up database schema
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        phone_e164 TEXT UNIQUE,
        birthdate TEXT NOT NULL,
        zodiac_sign TEXT NOT NULL,
        first_name TEXT,
        timezone TEXT NOT NULL DEFAULT 'America/New_York',
        delivery_method TEXT NOT NULL DEFAULT 'email',
        consent_given INTEGER NOT NULL DEFAULT 0,
        consent_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_sent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS delivery_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        delivery_method TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  });

  beforeEach(async () => {
    // Clean up test data between tests
    await env.DB.exec('DELETE FROM delivery_log');
    await env.DB.exec('DELETE FROM unsubscribe_tokens');
    await env.DB.exec('DELETE FROM users');
  });

  describe('CORS', () => {
    it('should allow requests from horoscope.boutique', async () => {
      const request = createRequest('/api', {
        headers: { Origin: 'https://horoscope.boutique' },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://horoscope.boutique'
      );
    });

    it('should not set CORS header for unknown origins', async () => {
      const request = createRequest('/api', {
        headers: { Origin: 'https://evil.com' },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('should handle OPTIONS preflight with valid origin', async () => {
      const request = createRequest('/api/signup', {
        method: 'OPTIONS',
        headers: { Origin: 'https://horoscope.boutique' },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://horoscope.boutique'
      );
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should reject OPTIONS preflight with invalid origin', async () => {
      const request = createRequest('/api/signup', {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.com' },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/signup', () => {
    it('should create a new subscription with valid data', async () => {
      const request = createJsonRequest('/api/signup', {
        email: 'test@example.com',
        birthdate: '1990-06-15',
        consent_given: true,
        timezone: 'America/New_York',
        delivery_method: 'email',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.zodiac_sign).toBe('Gemini');
    });

    it('should reject signup without email', async () => {
      const request = createJsonRequest('/api/signup', {
        birthdate: '1990-06-15',
        consent_given: true,
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    it('should reject signup without consent', async () => {
      const request = createJsonRequest('/api/signup', {
        email: 'test@example.com',
        birthdate: '1990-06-15',
        consent_given: false,
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('consent');
    });

    it('should reject invalid birthdate', async () => {
      const request = createJsonRequest('/api/signup', {
        email: 'test@example.com',
        birthdate: 'not-a-date',
        consent_given: true,
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('birthdate');
    });

    it('should require phone for SMS delivery method', async () => {
      const request = createJsonRequest('/api/signup', {
        email: 'test@example.com',
        birthdate: '1990-06-15',
        consent_given: true,
        delivery_method: 'sms',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Phone');
    });
  });

  describe('POST /api/unsubscribe', () => {
    it('should unsubscribe existing user', async () => {
      // First create a user
      await env.DB.prepare(`
        INSERT INTO users (email, birthdate, zodiac_sign, consent_given, consent_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `)
        .bind('unsubscribe@example.com', '1990-01-01', 'Capricorn')
        .run();

      const request = createJsonRequest('/api/unsubscribe', {
        email: 'unsubscribe@example.com',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify user is inactive
      const user = await env.DB.prepare('SELECT is_active FROM users WHERE email = ?')
        .bind('unsubscribe@example.com')
        .first();
      expect(user.is_active).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const request = createJsonRequest('/api/unsubscribe', {
        email: 'nonexistent@example.com',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/unsubscribe (token-based)', () => {
    it('should unsubscribe with valid token', async () => {
      // Create user
      const userResult = await env.DB.prepare(`
        INSERT INTO users (email, birthdate, zodiac_sign, consent_given, consent_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `)
        .bind('token-test@example.com', '1990-01-01', 'Capricorn')
        .run();

      const userId = userResult.meta.last_row_id;

      // Create valid token
      const token = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await env.DB.prepare(`
        INSERT INTO unsubscribe_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `)
        .bind(userId, token, expiresAt)
        .run();

      const request = createRequest(`/api/unsubscribe?token=${token}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Successfully Unsubscribed');

      // Verify user is inactive
      const user = await env.DB.prepare('SELECT is_active FROM users WHERE id = ?')
        .bind(userId)
        .first();
      expect(user.is_active).toBe(0);

      // Verify token is marked as used
      const tokenRecord = await env.DB.prepare('SELECT used FROM unsubscribe_tokens WHERE token = ?')
        .bind(token)
        .first();
      expect(tokenRecord.used).toBe(1);
    });

    it('should reject expired token', async () => {
      // Create user
      const userResult = await env.DB.prepare(`
        INSERT INTO users (email, birthdate, zodiac_sign, consent_given, consent_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `)
        .bind('expired-token@example.com', '1990-01-01', 'Capricorn')
        .run();

      const userId = userResult.meta.last_row_id;

      // Create expired token
      const token = 'b'.repeat(64);
      const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
      await env.DB.prepare(`
        INSERT INTO unsubscribe_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `)
        .bind(userId, token, expiresAt)
        .run();

      const request = createRequest(`/api/unsubscribe?token=${token}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Expired');
    });

    it('should reject invalid token', async () => {
      const request = createRequest('/api/unsubscribe?token=invalid');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('Root endpoint', () => {
    it('should return API info', async () => {
      const request = createRequest('/api');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.service).toBe('Horoscope Boutique API');
      expect(data.endpoints).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const request = createRequest('/api/unknown');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });
});
