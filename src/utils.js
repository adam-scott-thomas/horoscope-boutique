/**
 * Utility Functions
 * Phone validation, timezone handling, date utilities
 */

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Raw phone number
 * @returns {string|null} - E.164 formatted phone or null if invalid
 */
export function normalizePhoneE164(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If it starts with 1 and has 11 digits (US/Canada)
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }

  // If it has 10 digits, assume US/Canada and prepend 1
  if (digits.length === 10) {
    return '+1' + digits;
  }

  // If it's already 11+ digits, assume it includes country code
  if (digits.length >= 11) {
    return '+' + digits;
  }

  // Invalid format
  return null;
}

/**
 * Validate E.164 phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export function isValidE164(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // E.164 format: +[country code][number]
  // Length: 1-15 digits after the +
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate timezone (IANA timezone identifier)
 * @param {string} timezone - Timezone string
 * @returns {boolean} - True if valid
 */
export function isValidTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 * @returns {string} - Today's date
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a timestamp is from today
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {boolean} - True if timestamp is from today
 */
export function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}

/**
 * Get current local time for a timezone
 * @param {string} timezone - IANA timezone identifier
 * @returns {Object} - { hour, minute, dateString }
 */
export function getLocalTime(timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value;

  return {
    hour: parseInt(getPart('hour'), 10),
    minute: parseInt(getPart('minute'), 10),
    dateString: `${getPart('year')}-${getPart('month')}-${getPart('day')}`
  };
}

/**
 * Generate random alphanumeric token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
export function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Random choice from array
 * @param {Array} array - Input array
 * @returns {*} - Random element
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
