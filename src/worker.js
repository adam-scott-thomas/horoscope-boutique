/**
 * Horoscope Boutique - Cloudflare Worker
 * Production-ready horoscope subscription service
 *
 * Features:
 * - User signup with consent tracking
 * - Automatic zodiac sign derivation from birthday
 * - Daily horoscope delivery via email/SMS
 * - Timezone-aware scheduling
 * - One-send-per-day enforcement
 * - Unsubscribe functionality
 */

import { getZodiacSign, isValidBirthdate } from './zodiac.js';
import {
  normalizePhoneE164,
  isValidE164,
  isValidEmail,
  isValidTimezone,
  getTodayISO,
  isToday,
  getLocalTime,
  generateSecureToken
} from './utils.js';
import { generateHoroscope, formatHoroscopeSMS, formatHoroscopeEmail, getEmailSubject } from './horoscope.js';
import { sendHoroscopeEmail } from './email.js';
import { sendHoroscopeSMS } from './sms.js';

// ========================================
// RATE LIMITING CONFIGURATION
// ========================================

const RATE_LIMITS = {
  '/api/signup': { requests: 5, windowMinutes: 60 },       // 5 signups per hour per IP
  '/api/unsubscribe': { requests: 10, windowMinutes: 60 }, // 10 unsubscribes per hour per IP
  '/api/request': { requests: 3, windowMinutes: 60 },      // 3 manual requests per hour per IP
  default: { requests: 60, windowMinutes: 60 }             // 60 requests per hour for other endpoints
};

/**
 * Check if request exceeds rate limit
 * @param {Object} env - Environment variables
 * @param {string} ip - Client IP address
 * @param {string} endpoint - API endpoint
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date, limit: number}>}
 */
async function checkRateLimit(env, ip, endpoint) {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString();

  // Count recent requests
  const result = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM rate_limits
    WHERE ip_address = ? AND endpoint = ? AND request_at > ?
  `).bind(ip, endpoint, windowStart).first();

  const count = result?.count || 0;
  const allowed = count < config.requests;
  const remaining = Math.max(0, config.requests - count - 1);
  const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000);

  // Log the request if allowed
  if (allowed) {
    await env.DB.prepare(`
      INSERT INTO rate_limits (ip_address, endpoint, request_at)
      VALUES (?, ?, datetime('now'))
    `).bind(ip, endpoint).run();
  }

  return { allowed, remaining, resetAt, limit: config.requests };
}

/**
 * Get client IP from request headers
 * @param {Request} request - Incoming request
 * @returns {string} - Client IP address
 */
function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         'unknown';
}

/**
 * Rate limit exceeded response
 */
function rateLimitResponse(rateInfo, origin) {
  const headers = {
    'Content-Type': 'application/json',
    'Retry-After': Math.ceil((rateInfo.resetAt - Date.now()) / 1000).toString(),
    'X-RateLimit-Limit': rateInfo.limit.toString(),
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': rateInfo.resetAt.toISOString()
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    limit: rateInfo.limit,
    remaining: 0,
    reset_at: rateInfo.resetAt.toISOString()
  }), { status: 429, headers });
}

// ========================================
// CORS CONFIGURATION
// ========================================

/**
 * Get allowed origins based on environment
 * @param {Object} env - Environment variables
 * @returns {string[]} - List of allowed origins
 */
function getAllowedOrigins(env) {
  const origins = [
    'https://horoscope.boutique',
    'https://www.horoscope.boutique'
  ];

  // Add localhost for development
  if (env.ENVIRONMENT === 'development') {
    origins.push('http://localhost:8787');
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:8787');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
}

/**
 * Validate request origin against whitelist
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {string|null} - Valid origin or null
 */
function getValidOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const allowedOrigins = getAllowedOrigins(env);
  return allowedOrigins.includes(origin) ? origin : null;
}

// ========================================
// API HANDLERS
// ========================================

/**
 * POST /signup - User registration endpoint
 * Creates new user or updates existing user
 */
async function handleSignup(request, env, origin) {
  try {
    const body = await request.json();
    const {
      email,
      phone,
      birthdate,
      first_name,
      timezone,
      delivery_method,
      consent_given
    } = body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400, origin);
    }

    if (!birthdate || !isValidBirthdate(birthdate)) {
      return jsonResponse({ error: 'Valid birthdate is required (YYYY-MM-DD format)' }, 400, origin);
    }

    if (!consent_given) {
      return jsonResponse({ error: 'Explicit consent is required' }, 400, origin);
    }

    // Normalize and validate phone if provided
    let phoneE164 = null;
    if (phone) {
      phoneE164 = normalizePhoneE164(phone);
      if (!phoneE164 || !isValidE164(phoneE164)) {
        return jsonResponse({ error: 'Invalid phone number format. Use E.164 format (e.g., +12025551234)' }, 400, origin);
      }
    }

    // Validate delivery method requires appropriate contact info
    const deliveryMethodValue = delivery_method || 'email';
    if ((deliveryMethodValue === 'sms' || deliveryMethodValue === 'both') && !phoneE164) {
      return jsonResponse({ error: 'Phone number required for SMS delivery' }, 400, origin);
    }

    // Validate timezone
    const timezoneValue = timezone || 'America/New_York';
    if (!isValidTimezone(timezoneValue)) {
      return jsonResponse({ error: 'Invalid timezone' }, 400, origin);
    }

    // Derive zodiac sign
    const zodiacSign = getZodiacSign(birthdate);

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id, is_active FROM users WHERE email = ?'
    ).bind(email).first();

    let userId;

    if (existingUser) {
      // Update existing user
      await env.DB.prepare(`
        UPDATE users
        SET phone_e164 = ?, birthdate = ?, zodiac_sign = ?, first_name = ?,
            timezone = ?, delivery_method = ?, consent_given = 1,
            consent_at = datetime('now'), is_active = 1, updated_at = datetime('now')
        WHERE email = ?
      `).bind(phoneE164, birthdate, zodiacSign, first_name, timezoneValue, deliveryMethodValue, email).run();

      userId = existingUser.id;
    } else {
      // Insert new user
      const result = await env.DB.prepare(`
        INSERT INTO users (email, phone_e164, birthdate, zodiac_sign, first_name, timezone, delivery_method, consent_given, consent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `).bind(email, phoneE164, birthdate, zodiacSign, first_name, timezoneValue, deliveryMethodValue).run();

      userId = result.meta.last_row_id;
    }

    // Get updated user
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    // Send immediate horoscope
    const horoscope = generateHoroscope(user);
    const sendResults = await sendHoroscope(env, user, horoscope);

    return jsonResponse({
      success: true,
      message: 'Subscription created successfully',
      user: {
        id: user.id,
        email: user.email,
        zodiac_sign: user.zodiac_sign,
        timezone: user.timezone,
        delivery_method: user.delivery_method
      },
      immediate_delivery: sendResults
    }, 200, origin);

  } catch (error) {
    console.error('Signup error:', error);
    return jsonResponse({ error: error.message }, 500, origin);
  }
}

/**
 * POST /request - Manual horoscope request
 * Enforces one-send-per-day rule
 */
async function handleRequest(request, env, origin) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400, origin);
    }

    // Get user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    if (!user) {
      return jsonResponse({ error: 'User not found or inactive' }, 404, origin);
    }

    // Check if already sent today
    if (user.last_sent_at && isToday(user.last_sent_at)) {
      return jsonResponse({
        error: 'Horoscope already sent today',
        last_sent_at: user.last_sent_at
      }, 429, origin);
    }

    // Generate and send horoscope
    const horoscope = generateHoroscope(user);
    const sendResults = await sendHoroscope(env, user, horoscope);

    return jsonResponse({
      success: true,
      message: 'Horoscope sent successfully',
      delivery: sendResults
    }, 200, origin);

  } catch (error) {
    console.error('Request error:', error);
    return jsonResponse({ error: error.message }, 500, origin);
  }
}

/**
 * POST /unsubscribe - Unsubscribe endpoint
 */
async function handleUnsubscribe(request, env, origin) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400, origin);
    }

    // Deactivate user
    const result = await env.DB.prepare(
      'UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE email = ?'
    ).bind(email).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: 'User not found' }, 404, origin);
    }

    return jsonResponse({
      success: true,
      message: 'Successfully unsubscribed from daily horoscopes'
    }, 200, origin);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return jsonResponse({ error: error.message }, 500, origin);
  }
}

/**
 * GET /unsubscribe - Unsubscribe via URL (for email links)
 * Uses opaque token instead of exposing email in URL
 */
async function handleUnsubscribeGet(request, env, origin) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // Validate token
    if (!token || token.length < 32) {
      return htmlResponse('<h1>Invalid unsubscribe link</h1><p>This link may have expired or is invalid.</p>', 400, origin);
    }

    // Look up token in database
    const tokenRecord = await env.DB.prepare(`
      SELECT t.user_id, t.expires_at, t.used, u.email
      FROM unsubscribe_tokens t
      JOIN users u ON u.id = t.user_id
      WHERE t.token = ?
    `).bind(token).first();

    if (!tokenRecord) {
      return htmlResponse('<h1>Invalid unsubscribe link</h1><p>This link may have expired or is invalid.</p>', 400, origin);
    }

    // Check if token expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return htmlResponse('<h1>Link Expired</h1><p>This unsubscribe link has expired. Please use a more recent email to unsubscribe.</p>', 400, origin);
    }

    // Check if already used
    if (tokenRecord.used) {
      return htmlResponse('<h1>Already Unsubscribed</h1><p>You have already been unsubscribed from daily horoscopes.</p>', 200, origin);
    }

    // Deactivate user and mark token as used
    await env.DB.prepare(
      'UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(tokenRecord.user_id).run();

    await env.DB.prepare(
      'UPDATE unsubscribe_tokens SET used = 1 WHERE token = ?'
    ).bind(token).run();

    const baseUrl = env.BASE_URL || 'https://horoscope.boutique';
    return htmlResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Horoscope Boutique</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          h1 { color: #667eea; }
          p { color: #555; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Successfully Unsubscribed</h1>
        <p>You've been unsubscribed from daily horoscope emails.</p>
        <p>We're sorry to see you go! You can resubscribe anytime at <a href="${baseUrl}">${baseUrl.replace('https://', '')}</a></p>
      </body>
      </html>
    `, 200, origin);

  } catch (error) {
    console.error('Unsubscribe GET error:', error);
    return htmlResponse('<h1>Error processing unsubscribe request</h1>', 500, origin);
  }
}

// ========================================
// SCHEDULED CRON HANDLER
// ========================================

/**
 * Scheduled handler - Runs hourly
 * Checks each user's local time and sends at 9:00 AM
 * Also performs cleanup of expired tokens and rate limits
 */
async function handleScheduled(event, env) {
  console.log('Starting scheduled horoscope delivery check');

  try {
    // Cleanup old rate limit entries (older than 1 hour)
    await env.DB.prepare(
      "DELETE FROM rate_limits WHERE request_at < datetime('now', '-1 hour')"
    ).run();

    // Cleanup expired unsubscribe tokens (older than 30 days + 1 day buffer)
    await env.DB.prepare(
      "DELETE FROM unsubscribe_tokens WHERE expires_at < datetime('now', '-1 day')"
    ).run();

    console.log('Cleanup of expired tokens and rate limits complete');

    // Get all active users
    const { results: users } = await env.DB.prepare(
      'SELECT * FROM users WHERE is_active = 1'
    ).all();

    console.log(`Found ${users.length} active users`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Get user's local time
        const localTime = getLocalTime(user.timezone);

        // Check if it's 9:00 AM in user's timezone (9:00-9:59)
        if (localTime.hour !== 9) {
          continue; // Not 9 AM yet or already past
        }

        // Check if already sent today
        if (user.last_sent_at && isToday(user.last_sent_at)) {
          skippedCount++;
          console.log(`Skipped user ${user.id}: Already sent today`);
          continue;
        }

        // Generate and send horoscope
        const horoscope = generateHoroscope(user);
        await sendHoroscope(env, user, horoscope);

        sentCount++;
        console.log(`Sent horoscope to user ${user.id} (${user.email})`);

      } catch (error) {
        errorCount++;
        console.error(`Error sending to user ${user.id}:`, error);
      }
    }

    console.log(`Scheduled delivery complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);

  } catch (error) {
    console.error('Scheduled handler error:', error);
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Send horoscope via user's preferred delivery method
 */
async function sendHoroscope(env, user, horoscope) {
  const results = {};

  try {
    // Generate secure unsubscribe token
    const unsubscribeToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    // Store token in database
    await env.DB.prepare(`
      INSERT INTO unsubscribe_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, unsubscribeToken, expiresAt).run();

    // Prepare messages with token-based unsubscribe URL
    const baseUrl = env.BASE_URL || 'https://horoscope.boutique';
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`;
    const smsMessage = formatHoroscopeSMS(horoscope);
    const emailHtml = formatHoroscopeEmail(horoscope, unsubscribeUrl);
    const emailSubject = getEmailSubject(horoscope);

    // Send based on delivery method
    if (user.delivery_method === 'email' || user.delivery_method === 'both') {
      results.email = await sendHoroscopeEmail(env, user.email, emailSubject, emailHtml);
    }

    if (user.delivery_method === 'sms' || user.delivery_method === 'both') {
      if (user.phone_e164) {
        results.sms = await sendHoroscopeSMS(env, user.phone_e164, smsMessage);
      }
    }

    // Update last_sent_at
    await env.DB.prepare(
      'UPDATE users SET last_sent_at = datetime(\'now\') WHERE id = ?'
    ).bind(user.id).run();

    // Log delivery
    const deliveryStatus = (results.email?.success || results.sms?.success) ? 'success' : 'failed';
    await env.DB.prepare(`
      INSERT INTO delivery_log (user_id, delivery_method, status)
      VALUES (?, ?, ?)
    `).bind(user.id, user.delivery_method, deliveryStatus).run();

    return results;

  } catch (error) {
    // Log failure
    await env.DB.prepare(`
      INSERT INTO delivery_log (user_id, delivery_method, status, error_message)
      VALUES (?, ?, 'failed', ?)
    `).bind(user.id, user.delivery_method, error.message).run();

    throw error;
  }
}

/**
 * JSON response helper with CORS
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {string|null} origin - Validated origin for CORS
 */
function jsonResponse(data, status = 200, origin = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

/**
 * HTML response helper with CORS
 * @param {string} html - HTML content
 * @param {number} status - HTTP status code
 * @param {string|null} origin - Validated origin for CORS
 */
function htmlResponse(html, status = 200, origin = null) {
  const headers = {
    'Content-Type': 'text/html'
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return new Response(html, { status, headers });
}

// ========================================
// MAIN WORKER EXPORT
// ========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = getValidOrigin(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!origin) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin'
        }
      });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Route handling with rate limiting for protected endpoints
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      const rateLimit = await checkRateLimit(env, clientIP, '/api/signup');
      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit, origin);
      }
      return handleSignup(request, env, origin);
    }

    if (url.pathname === '/api/request' && request.method === 'POST') {
      const rateLimit = await checkRateLimit(env, clientIP, '/api/request');
      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit, origin);
      }
      return handleRequest(request, env, origin);
    }

    if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
      const rateLimit = await checkRateLimit(env, clientIP, '/api/unsubscribe');
      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit, origin);
      }
      return handleUnsubscribe(request, env, origin);
    }

    if (url.pathname === '/api/unsubscribe' && request.method === 'GET') {
      const rateLimit = await checkRateLimit(env, clientIP, '/api/unsubscribe');
      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit, origin);
      }
      return handleUnsubscribeGet(request, env, origin);
    }

    // Root endpoint - API info
    if (url.pathname === '/' || url.pathname === '/api') {
      return jsonResponse({
        service: 'Horoscope Boutique API',
        version: '1.0.0',
        endpoints: {
          'POST /api/signup': 'Register for daily horoscopes',
          'POST /api/request': 'Manually request today\'s horoscope',
          'POST /api/unsubscribe': 'Unsubscribe from daily horoscopes',
          'GET /api/unsubscribe?token=xxx': 'Unsubscribe via email link'
        }
      }, 200, origin);
    }

    return jsonResponse({ error: 'Not Found' }, 404, origin);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  }
};
