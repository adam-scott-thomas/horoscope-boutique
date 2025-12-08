/**
 * Zodiac Sign Calculator
 * Derives zodiac sign from birthdate (server-side only)
 */

export const ZODIAC_SIGNS = {
  ARIES: 'Aries',
  TAURUS: 'Taurus',
  GEMINI: 'Gemini',
  CANCER: 'Cancer',
  LEO: 'Leo',
  VIRGO: 'Virgo',
  LIBRA: 'Libra',
  SCORPIO: 'Scorpio',
  SAGITTARIUS: 'Sagittarius',
  CAPRICORN: 'Capricorn',
  AQUARIUS: 'Aquarius',
  PISCES: 'Pisces'
};

/**
 * Calculate zodiac sign from birthdate
 * @param {string} birthdate - ISO 8601 date string (YYYY-MM-DD)
 * @returns {string} - Zodiac sign name
 */
export function getZodiacSign(birthdate) {
  const date = new Date(birthdate);
  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate(); // 1-31

  // Zodiac boundaries
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return ZODIAC_SIGNS.ARIES;
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return ZODIAC_SIGNS.TAURUS;
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return ZODIAC_SIGNS.GEMINI;
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return ZODIAC_SIGNS.CANCER;
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return ZODIAC_SIGNS.LEO;
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return ZODIAC_SIGNS.VIRGO;
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return ZODIAC_SIGNS.LIBRA;
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return ZODIAC_SIGNS.SCORPIO;
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return ZODIAC_SIGNS.SAGITTARIUS;
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return ZODIAC_SIGNS.CAPRICORN;
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return ZODIAC_SIGNS.AQUARIUS;
  } else {
    return ZODIAC_SIGNS.PISCES; // Feb 19 - Mar 20
  }
}

/**
 * Validate birthdate format and reasonableness
 * @param {string} birthdate - Date string
 * @returns {boolean} - True if valid
 */
export function isValidBirthdate(birthdate) {
  if (!birthdate || typeof birthdate !== 'string') {
    return false;
  }

  // Check ISO 8601 format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(birthdate)) {
    return false;
  }

  const date = new Date(birthdate);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check reasonable range (1900 to today)
  const year = date.getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  if (year < 1900 || year > currentYear) {
    return false;
  }

  return true;
}

/**
 * Lucky colors by zodiac sign
 */
export const LUCKY_COLORS = {
  [ZODIAC_SIGNS.ARIES]: ['Red', 'Coral', 'Scarlet'],
  [ZODIAC_SIGNS.TAURUS]: ['Green', 'Pink', 'Emerald'],
  [ZODIAC_SIGNS.GEMINI]: ['Yellow', 'Light Blue', 'Silver'],
  [ZODIAC_SIGNS.CANCER]: ['White', 'Silver', 'Pale Blue'],
  [ZODIAC_SIGNS.LEO]: ['Gold', 'Orange', 'Purple'],
  [ZODIAC_SIGNS.VIRGO]: ['Navy Blue', 'Grey', 'Beige'],
  [ZODIAC_SIGNS.LIBRA]: ['Pink', 'Light Blue', 'Lavender'],
  [ZODIAC_SIGNS.SCORPIO]: ['Deep Red', 'Black', 'Burgundy'],
  [ZODIAC_SIGNS.SAGITTARIUS]: ['Purple', 'Royal Blue', 'Turquoise'],
  [ZODIAC_SIGNS.CAPRICORN]: ['Brown', 'Dark Green', 'Charcoal'],
  [ZODIAC_SIGNS.AQUARIUS]: ['Electric Blue', 'Silver', 'Turquoise'],
  [ZODIAC_SIGNS.PISCES]: ['Sea Green', 'Lavender', 'Aquamarine']
};

/**
 * Get lucky color for a zodiac sign
 * @param {string} sign - Zodiac sign name
 * @returns {string} - Random lucky color
 */
export function getLuckyColor(sign) {
  const colors = LUCKY_COLORS[sign] || ['Blue'];
  return colors[Math.floor(Math.random() * colors.length)];
}
