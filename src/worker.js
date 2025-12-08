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
  getLocalTime
} from './utils.js';
import { generateHoroscope, formatHoroscopeSMS, formatHoroscopeEmail, getEmailSubject } from './horoscope.js';
import { sendHoroscopeEmail } from './email.js';
import { sendHoroscopeSMS } from './sms.js';

// ========================================
// API HANDLERS
// ========================================

/**
 * POST /signup - User registration endpoint
 * Creates new user or updates existing user
 */
async function handleSignup(request, env) {
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
      return jsonResponse({ error: 'Valid email is required' }, 400);
    }

    if (!birthdate || !isValidBirthdate(birthdate)) {
      return jsonResponse({ error: 'Valid birthdate is required (YYYY-MM-DD format)' }, 400);
    }

    if (!consent_given) {
      return jsonResponse({ error: 'Explicit consent is required' }, 400);
    }

    // Normalize and validate phone if provided
    let phoneE164 = null;
    if (phone) {
      phoneE164 = normalizePhoneE164(phone);
      if (!phoneE164 || !isValidE164(phoneE164)) {
        return jsonResponse({ error: 'Invalid phone number format. Use E.164 format (e.g., +12025551234)' }, 400);
      }
    }

    // Validate delivery method requires appropriate contact info
    const deliveryMethodValue = delivery_method || 'email';
    if ((deliveryMethodValue === 'sms' || deliveryMethodValue === 'both') && !phoneE164) {
      return jsonResponse({ error: 'Phone number required for SMS delivery' }, 400);
    }

    // Validate timezone
    const timezoneValue = timezone || 'America/New_York';
    if (!isValidTimezone(timezoneValue)) {
      return jsonResponse({ error: 'Invalid timezone' }, 400);
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
    });

  } catch (error) {
    console.error('Signup error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * POST /request - Manual horoscope request
 * Enforces one-send-per-day rule
 */
async function handleRequest(request, env) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400);
    }

    // Get user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    if (!user) {
      return jsonResponse({ error: 'User not found or inactive' }, 404);
    }

    // Check if already sent today
    if (user.last_sent_at && isToday(user.last_sent_at)) {
      return jsonResponse({
        error: 'Horoscope already sent today',
        last_sent_at: user.last_sent_at
      }, 429);
    }

    // Generate and send horoscope
    const horoscope = generateHoroscope(user);
    const sendResults = await sendHoroscope(env, user, horoscope);

    return jsonResponse({
      success: true,
      message: 'Horoscope sent successfully',
      delivery: sendResults
    });

  } catch (error) {
    console.error('Request error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * POST /unsubscribe - Unsubscribe endpoint
 */
async function handleUnsubscribe(request, env) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email is required' }, 400);
    }

    // Deactivate user
    const result = await env.DB.prepare(
      'UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE email = ?'
    ).bind(email).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    return jsonResponse({
      success: true,
      message: 'Successfully unsubscribed from daily horoscopes'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * GET /unsubscribe - Unsubscribe via URL (for email links)
 */
async function handleUnsubscribeGet(request, env) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email || !isValidEmail(email)) {
      return htmlResponse('<h1>Invalid email address</h1>', 400);
    }

    // Deactivate user
    const result = await env.DB.prepare(
      'UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE email = ?'
    ).bind(email).run();

    if (result.meta.changes === 0) {
      return htmlResponse('<h1>User not found</h1>', 404);
    }

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
        <h1>✓ Successfully Unsubscribed</h1>
        <p>You've been unsubscribed from daily horoscope emails.</p>
        <p>We're sorry to see you go! You can resubscribe anytime at horoscope.boutique</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Unsubscribe GET error:', error);
    return htmlResponse('<h1>Error processing unsubscribe request</h1>', 500);
  }
}

// ========================================
// SCHEDULED CRON HANDLER
// ========================================

/**
 * Scheduled handler - Runs hourly
 * Checks each user's local time and sends at 9:00 AM
 */
async function handleScheduled(event, env) {
  console.log('Starting scheduled horoscope delivery check');

  try {
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
    // Prepare messages
    const unsubscribeUrl = `https://horoscope.boutique/api/unsubscribe?email=${encodeURIComponent(user.email)}`;
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
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * HTML response helper
 */
function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ========================================
// MAIN WORKER EXPORT
// ========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Route handling
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      return handleSignup(request, env);
    }

    if (url.pathname === '/api/request' && request.method === 'POST') {
      return handleRequest(request, env);
    }

    if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
      return handleUnsubscribe(request, env);
    }

    if (url.pathname === '/api/unsubscribe' && request.method === 'GET') {
      return handleUnsubscribeGet(request, env);
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
          'GET /api/unsubscribe?email=xxx': 'Unsubscribe via email link'
        }
      });
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  }
};
