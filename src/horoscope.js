/**
 * Horoscope Content Generator
 * Generates personalized daily horoscopes
 */

import { getLuckyColor } from './zodiac.js';
import { randomChoice } from './utils.js';

const MANTRAS = [
  'I am exactly where I need to be',
  'I embrace growth with an open heart',
  'My energy attracts beautiful possibilities',
  'I trust the journey unfolding before me',
  'I am worthy of love, joy, and success',
  'Today, I choose peace and positivity',
  'I am aligned with my highest purpose',
  'I radiate confidence and inner strength',
  'I welcome abundance in all forms',
  'My path is illuminated by inner wisdom'
];

const DAILY_FOCUS = [
  'Self-care',
  'Communication',
  'Creativity',
  'Connection',
  'Gratitude',
  'Joy',
  'Growth',
  'Balance',
  'Adventure',
  'Reflection'
];

/**
 * Generate horoscope templates
 * In production, consider using Claude API or pre-written content library
 */
const HOROSCOPE_TEMPLATES = [
  (name, sign) =>
    `Dear ${name}, today's cosmic energy brings a wave of renewal and possibility. As a ${sign}, you're particularly attuned to the shifts happening around you, and this is your moment to shine. The universe is aligning to support your dreams, encouraging you to trust your intuition and take meaningful steps forward. You may feel a surge of creative inspiration or a desire to connect more deeply with those you cherish. Remember, growth sometimes asks you to be vulnerable, but that vulnerability is your strength. Embrace this day with an open heart, knowing you're exactly where you need to be.`,

  (name, sign) =>
    `${name}, the stars are sending you powerful affirmations today. As a ${sign}, your natural gifts are being amplified by celestial energy that celebrates authenticity and courage. This is a time to honor your feelings, express your truth, and take bold steps toward what makes your soul sing. You might encounter situations that challenge you to grow, but these are invitations to discover your inner resilience. The connections you nurture today will flourish, and your presence brings warmth to everyone around you.`,

  (name, sign) =>
    `Hello ${name}! Today brings fresh energy for ${sign} individuals like yourself. The cosmos is highlighting your unique strengths and encouraging you to step into your power with confidence. Whether you're tackling challenges or celebrating victories, remember that your perspective is valuable and your contributions matter. This is an excellent day for meaningful conversations, creative pursuits, and acts of kindness. Trust that you have everything you need to navigate whatever comes your way.`,

  (name, sign) =>
    `Greetings ${name}, as a ${sign}, you're entering a period of beautiful alignment. The universe is conspiring to bring opportunities that resonate with your deepest values and aspirations. Pay attention to synchronicities and unexpected moments of joy—they're signs you're on the right path. Today favors collaboration, self-expression, and nurturing relationships that uplift you. Your authentic self is your superpower, so let it shine brightly.`,

  (name, sign) =>
    `${name}, today's horoscope for ${sign} speaks of transformation and positive momentum. You're being invited to release what no longer serves you and make space for new blessings. The energy surrounding you supports both practical progress and emotional healing. Trust your instincts, especially in matters of the heart and personal growth. Remember that every step forward, no matter how small, is bringing you closer to your dreams.`
];

/**
 * Generate a personalized horoscope
 * @param {Object} user - User object from database
 * @returns {Object} - Horoscope data
 */
export function generateHoroscope(user) {
  const template = randomChoice(HOROSCOPE_TEMPLATES);
  const name = user.first_name || 'Friend';
  const sign = user.zodiac_sign;

  return {
    user_id: user.id,
    name: name,
    sign: sign,
    horoscope: template(name, sign),
    lucky_color: getLuckyColor(sign),
    mantra: randomChoice(MANTRAS),
    daily_focus: randomChoice(DAILY_FOCUS),
    date: new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString()
  };
}

/**
 * Format horoscope for SMS (concise)
 * @param {Object} data - Horoscope data
 * @returns {string} - SMS message
 */
export function formatHoroscopeSMS(data) {
  let msg = `✨ Daily Horoscope for ${data.name} ✨\n\n`;
  msg += `${data.horoscope}\n\n`;
  msg += `🎨 Lucky Color: ${data.lucky_color}\n`;
  msg += `💫 Mantra: ${data.mantra}\n`;
  msg += `🎯 Focus: ${data.daily_focus}\n\n`;
  msg += `Reply STOP to unsubscribe`;
  return msg;
}

/**
 * Format horoscope for email (HTML)
 * @param {Object} data - Horoscope data
 * @param {string} unsubscribeUrl - Unsubscribe URL
 * @returns {string} - HTML email
 */
export function formatHoroscopeEmail(data, unsubscribeUrl) {
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
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">✨ Your Daily Horoscope</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Dear ${data.name},</h2>
                            <p style="color: #667eea; margin: 0 0 20px 0; font-size: 16px; font-weight: 500;">${data.sign}</p>
                            <div style="color: #555; line-height: 1.8; font-size: 16px; margin: 0;">
                                ${data.horoscope}
                            </div>
                        </td>
                    </tr>

                    <!-- Highlights Box -->
                    <tr>
                        <td style="padding: 0 35px 40px 35px;">
                            <table width="100%" cellpadding="20" cellspacing="0" style="background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%); border-radius: 10px; border: 1px solid #e6eaf0;">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 18px;">
                                            <span style="font-size: 20px; margin-right: 8px;">🎨</span>
                                            <span style="color: #667eea; font-weight: 600; font-size: 15px;">Lucky Color:</span>
                                            <span style="color: #333; margin-left: 8px; font-size: 15px;">${data.lucky_color}</span>
                                        </div>
                                        <div style="margin-bottom: 18px;">
                                            <span style="font-size: 20px; margin-right: 8px;">💫</span>
                                            <span style="color: #667eea; font-weight: 600; font-size: 15px;">Today's Mantra:</span>
                                            <div style="color: #333; margin: 8px 0 0 36px; font-style: italic; font-size: 15px; line-height: 1.6;">"${data.mantra}"</div>
                                        </div>
                                        <div>
                                            <span style="font-size: 20px; margin-right: 8px;">🎯</span>
                                            <span style="color: #667eea; font-weight: 600; font-size: 15px;">Daily Focus:</span>
                                            <span style="color: #333; margin-left: 8px; font-size: 15px;">${data.daily_focus}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 35px; text-align: center; border-top: 1px solid #e6eaf0; background-color: #fafbfc; border-radius: 0 0 12px 12px;">
                            <p style="color: #999; font-size: 14px; margin: 0 0 12px 0;">
                                Wishing you a beautiful day ahead! 💜
                            </p>
                            <p style="margin: 0;">
                                <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none; font-size: 13px;">Unsubscribe</a>
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
 * @param {Object} data - Horoscope data
 * @returns {string} - Email subject
 */
export function getEmailSubject(data) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `✨ Your ${data.sign} Horoscope for ${date}`;
}
