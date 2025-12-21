/**
 * Horoscope Content Generator - GPT-4 Powered
 * Generates personalized daily horoscopes following strict content rules
 */

import { getLuckyColor } from './zodiac.js';

// ========================================
// SYSTEM PROMPT - Your content spec
// ========================================

const SYSTEM_PROMPT = `You are generating daily horoscope emails for horoscope.boutique.

GLOBAL INVARIANTS (hard rules)
1) EVERY email MUST end with a positive reframe.
   - If a true upside cannot be found, resilience itself becomes the upside.
   - If the output does not clearly end positive, it is invalid and must be regenerated.
2) Negatives must be acknowledged before reframing.
3) No fate, destiny, or "the universe" language.
4) No astrology cliches.
5) No exclamation points.
6) Tone must be adult, grounded, and credible. Humor is allowed. Camp is not.

REFRAME PATTERNS (you will be told which one to use)
A) Consequence Flip - The negative consequence enables something positive
B) Contrast Gain - Comparison to worse alternatives reveals hidden value
C) Timing Advantage - The timing, though inconvenient, offers unique opportunity
D) Resilience-as-Win - The act of enduring itself builds something valuable (fallback only)

TOO-DARK FAILSAFE
If you find yourself writing hopelessness, identity attacks, cruelty, or self-harm adjacency:
- Remove profanity
- Force reframe pattern D
- End with effort acknowledgment + forward motion

Write for an intelligent, mildly skeptical adult.
No lies. No glitter. End positive or regenerate.
Write like a smart friend who refuses to let the day win.`;

// ========================================
// REFRAME PATTERN SELECTION
// ========================================

const REFRAME_PATTERNS = ['A', 'B', 'C', 'D'];

/**
 * Select a reframe pattern, avoiding recent ones
 */
function selectReframePattern(recentPatterns = []) {
  const available = REFRAME_PATTERNS.filter(p => !recentPatterns.slice(0, 3).includes(p));
  if (available.length === 0) {
    // All used recently, pick any except the last one
    return REFRAME_PATTERNS.filter(p => p !== recentPatterns[0])[0] || 'A';
  }
  return available[Math.floor(Math.random() * available.length)];
}

// ========================================
// SPICY CONTENT LOGIC
// ========================================

/**
 * Calculate spicy probability based on day and conditions
 */
function calculateSpicyOdds(dayOfWeek, wasRoughDay, lastSpicyAt) {
  // Base odds by day
  const baseOdds = {
    0: 0.15, // Sunday
    1: 0.10, // Monday
    2: 0.10, // Tuesday
    3: 0.10, // Wednesday
    4: 0.10, // Thursday
    5: 0.35, // Friday
    6: 0.45  // Saturday
  };

  let odds = baseOdds[dayOfWeek] || 0.10;

  // Modifier: rough day adds 10%
  if (wasRoughDay) {
    odds += 0.10;
  }

  // Rate limit: check 72-hour cooldown
  if (lastSpicyAt) {
    const hoursSinceSpicy = (Date.now() - new Date(lastSpicyAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSpicy < 72) {
      return 0;
    }
  }

  // Clamp between 0 and 50%
  return Math.min(Math.max(odds, 0), 0.50);
}

/**
 * Determine if spicy content should be included
 */
function shouldIncludeSpicy(user, wasRoughDay) {
  if (!user.spicy_allowed) return { include: false, odds: 0 };

  const dayOfWeek = new Date().getDay();
  const odds = calculateSpicyOdds(dayOfWeek, wasRoughDay, user.last_spicy_at);
  const include = Math.random() < odds;

  return { include, odds };
}

// ========================================
// GPT-4 API INTEGRATION
// ========================================

/**
 * Call OpenAI GPT-4 API
 */
async function callGPT4(env, messages) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse GPT response into structured format
 */
function parseGPTResponse(content) {
  try {
    // Try to parse as JSON first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fall through to text parsing
  }

  // Return as plain text if JSON parsing fails
  return {
    subject: "Your Daily Horoscope",
    text: content,
    html: `<p>${content.replace(/\n/g, '</p><p>')}</p>`
  };
}

// ========================================
// MORNING EMAIL GENERATION
// ========================================

/**
 * Generate morning horoscope (9am, always sends)
 */
export async function generateMorningHoroscope(env, user, recentPatterns = []) {
  const reframePattern = selectReframePattern(recentPatterns);
  const patternDescriptions = {
    'A': 'Consequence Flip - The negative consequence enables something positive',
    'B': 'Contrast Gain - Comparison to worse alternatives reveals hidden value',
    'C': 'Timing Advantage - The timing, though inconvenient, offers unique opportunity',
    'D': 'Resilience-as-Win - The act of enduring itself builds something valuable'
  };

  const userPrompt = `Generate a MORNING horoscope email for ${user.first_name || 'this person'}, a ${user.zodiac_sign}.

Required structure (3-5 sentences total):
1) Overall tone of the day (neutral-realistic)
2) Likely friction or downside they may encounter
3) Where the reader still has leverage
4) End with an earned positive reframe + one practical action

Use reframe pattern ${reframePattern}: ${patternDescriptions[reframePattern]}

Respond in this exact JSON format:
{
  "subject": "short subject line, no emojis, no exclamation points",
  "text": "the plain text email body",
  "html": "the HTML formatted email body with <p> tags",
  "included_friction": true or false (did you include friction/downside?)
}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  const response = await callGPT4(env, messages);
  const parsed = parseGPTResponse(response);

  return {
    user_id: user.id,
    name: user.first_name || 'Friend',
    sign: user.zodiac_sign,
    type: 'morning',
    subject: parsed.subject || `Your ${user.zodiac_sign} Forecast`,
    text: parsed.text,
    html: parsed.html,
    reframe_pattern: reframePattern,
    included_friction: parsed.included_friction ?? true,
    spicy_used: false,
    spicy_odds: 0,
    lucky_color: getLuckyColor(user.zodiac_sign),
    date: new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString()
  };
}

// ========================================
// EVENING EMAIL GENERATION
// ========================================

/**
 * Generate evening horoscope (7pm, conditional)
 * Only sends if morning had friction
 */
export async function generateEveningHoroscope(env, user, morningHadFriction, recentPatterns = []) {
  if (!morningHadFriction) {
    return null; // Don't send evening email if morning had no friction
  }

  const reframePattern = selectReframePattern(recentPatterns);
  const spicyCheck = shouldIncludeSpicy(user, true); // Evening after friction = rough day

  const patternDescriptions = {
    'A': 'Consequence Flip',
    'B': 'Contrast Gain',
    'C': 'Timing Advantage',
    'D': 'Resilience-as-Win'
  };

  let spicyInstruction = '';
  if (spicyCheck.include) {
    spicyInstruction = `

SPICY CLOSER INSTRUCTION:
Include a sex-positive, non-graphic closer. Allowed: blunt encouragement, adult humor.
NOT allowed: explicit sexual descriptions. Keep it tasteful but adult.`;
  }

  let profanityInstruction = `

PROFANITY: You may use up to TWO swear words for emphasis. Use them to encourage, never to insult.`;

  const userPrompt = `Generate an EVENING horoscope email for ${user.first_name || 'this person'}, a ${user.zodiac_sign}.

Context: Their morning forecast included friction, so this day may have been challenging.

Required structure (3-5 sentences total):
1) Acknowledge the day may have sucked
2) Identify a real upside created by that difficulty
3) End with a firm, motivating positive reframe

Use reframe pattern ${reframePattern}: ${patternDescriptions[reframePattern]}${profanityInstruction}${spicyInstruction}

Respond in this exact JSON format:
{
  "subject": "short subject line, no emojis, no exclamation points",
  "text": "the plain text email body",
  "html": "the HTML formatted email body with <p> tags"
}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  const response = await callGPT4(env, messages);
  const parsed = parseGPTResponse(response);

  return {
    user_id: user.id,
    name: user.first_name || 'Friend',
    sign: user.zodiac_sign,
    type: 'evening',
    subject: parsed.subject || `${user.zodiac_sign} Evening Check-in`,
    text: parsed.text,
    html: parsed.html,
    reframe_pattern: reframePattern,
    included_friction: true,
    spicy_used: spicyCheck.include,
    spicy_odds: spicyCheck.odds,
    lucky_color: getLuckyColor(user.zodiac_sign),
    date: new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString()
  };
}

// ========================================
// LEGACY FUNCTION (for backwards compatibility)
// ========================================

/**
 * Generate horoscope - defaults to morning
 * @deprecated Use generateMorningHoroscope or generateEveningHoroscope
 */
export async function generateHoroscope(env, user, recentPatterns = []) {
  return generateMorningHoroscope(env, user, recentPatterns);
}

// ========================================
// EMAIL FORMATTING
// ========================================

/**
 * Format horoscope for SMS (concise)
 */
export function formatHoroscopeSMS(data) {
  let msg = `${data.sign} - ${data.type === 'evening' ? 'Evening' : 'Daily'}\n\n`;
  msg += `${data.text}\n\n`;
  msg += `Reply STOP to unsubscribe`;
  return msg;
}

/**
 * Format horoscope for email (HTML)
 */
export function formatHoroscopeEmail(data, unsubscribeUrl) {
  const headerColor = data.type === 'evening' ? '#4a4a6a' : '#667eea';
  const headerGradient = data.type === 'evening'
    ? 'linear-gradient(135deg, #4a4a6a 0%, #2d2d4a 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const timeLabel = data.type === 'evening' ? 'Evening Reflection' : 'Morning Forecast';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: ${headerGradient}; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${timeLabel}</p>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">${data.sign}</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 15px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            <div style="color: #333; line-height: 1.8; font-size: 17px;">
                                ${data.html || data.text.split('\n').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 35px; text-align: center; border-top: 1px solid #e6eaf0; background-color: #fafbfc; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0;">
                                <a href="${unsubscribeUrl}" style="color: #999; text-decoration: none; font-size: 13px;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Get email subject line
 */
export function getEmailSubject(data) {
  return data.subject || `${data.sign} - ${data.type === 'evening' ? 'Evening' : 'Daily'}`;
}
