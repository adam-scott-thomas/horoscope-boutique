/**
 * Cognitive Reflection Questions Module
 *
 * Questions designed to surface engagement with structure, not reassurance.
 * Each question introduces constraint, tension, or ambiguity.
 * Non-repeating per user until pool exhaustion.
 */

// SMS inclusion rate (30-50% of sends)
export const SMS_QUESTION_RATE = 0.4;

// Hard character cap for SMS questions
export const SMS_QUESTION_MAX_CHARS = 120;

/**
 * Question bank
 * - id: unique identifier for tracking
 * - full: email version (complete phrasing)
 * - short: SMS version (compressed, same intent)
 */
export const QUESTIONS = [
  {
    id: 'q001',
    full: 'Which part of today\'s message feels unnecessary, and why might it still be there?',
    short: 'What here feels unnecessary but stays anyway?'
  },
  {
    id: 'q002',
    full: 'If this advice were wrong, where would it most likely break first?',
    short: 'Where would this break if it were wrong?'
  },
  {
    id: 'q003',
    full: 'What assumption here feels invisible but important?',
    short: 'What invisible assumption matters most here?'
  },
  {
    id: 'q004',
    full: 'If you could remove one constraint from today, which one would you keep anyway?',
    short: 'Which constraint would you keep if you could drop one?'
  },
  {
    id: 'q005',
    full: 'What would someone who disagreed with this notice that you might not?',
    short: 'What would a skeptic notice here that you missed?'
  },
  {
    id: 'q006',
    full: 'Which word in today\'s message is doing the most work?',
    short: 'Which word here carries the most weight?'
  },
  {
    id: 'q007',
    full: 'What would change if you read this again in six months?',
    short: 'How would this read differently in six months?'
  },
  {
    id: 'q008',
    full: 'What question does this message assume you won\'t ask?',
    short: 'What question is this hoping you won\'t ask?'
  },
  {
    id: 'q009',
    full: 'If the opposite advice were given, what would stay true?',
    short: 'What stays true if the opposite were said?'
  },
  {
    id: 'q010',
    full: 'What part of this are you most likely to forget by tonight?',
    short: 'What here will you forget first?'
  },
  {
    id: 'q011',
    full: 'Which piece of this message is for everyone, and which piece might only be for you?',
    short: 'What here is generic vs. actually for you?'
  },
  {
    id: 'q012',
    full: 'What would make this message harder to agree with?',
    short: 'What would make this harder to accept?'
  },
  {
    id: 'q013',
    full: 'If you had to argue against today\'s advice, what would be your strongest point?',
    short: 'What\'s your best argument against this?'
  },
  {
    id: 'q014',
    full: 'What does this message want you to feel, and did it work?',
    short: 'What feeling is this aiming for? Did it land?'
  },
  {
    id: 'q015',
    full: 'Which part of this would you edit if you were sending it to someone else?',
    short: 'What would you change before forwarding this?'
  },
  {
    id: 'q016',
    full: 'What\'s the smallest thing that could make today\'s advice irrelevant?',
    short: 'What small thing could make this irrelevant?'
  },
  {
    id: 'q017',
    full: 'If this were a test, what would it be testing for?',
    short: 'If this were a test, what\'s being measured?'
  },
  {
    id: 'q018',
    full: 'What does agreeing with this commit you to?',
    short: 'What does agreeing with this commit you to?'
  },
  {
    id: 'q019',
    full: 'What would a version of you from five years ago think of this message?',
    short: 'What would past-you think of this?'
  },
  {
    id: 'q020',
    full: 'Which part of today\'s message would be hardest to explain to a stranger?',
    short: 'What here would be hardest to explain aloud?'
  }
];

// Soft cue prefixes for questions
const EMAIL_PREFIXES = [
  'One thing to sit with today:',
  'If you feel like it:',
  'A thought to carry:',
  'Something to notice:',
  'Before you go:'
];

const SMS_PREFIXES = [
  '💭',
  '🔍',
  '→'
];

/**
 * Get a random prefix for email questions
 */
export function getEmailPrefix() {
  return EMAIL_PREFIXES[Math.floor(Math.random() * EMAIL_PREFIXES.length)];
}

/**
 * Get a random prefix for SMS questions
 */
export function getSmsPrefix() {
  return SMS_PREFIXES[Math.floor(Math.random() * SMS_PREFIXES.length)];
}

/**
 * Select a question for a user, avoiding repeats until pool exhaustion
 * @param {string|null} seenQuestionsJson - JSON string of seen question IDs, or null
 * @returns {Object} - { question: {id, full, short}, seenQuestions: string[] }
 */
export function selectQuestion(seenQuestionsJson) {
  let seen = [];

  try {
    if (seenQuestionsJson) {
      seen = JSON.parse(seenQuestionsJson);
    }
  } catch (e) {
    seen = [];
  }

  // Get available questions (not yet seen)
  let available = QUESTIONS.filter(q => !seen.includes(q.id));

  // If all exhausted, reset pool
  if (available.length === 0) {
    seen = [];
    available = QUESTIONS;
  }

  // Random selection
  const question = available[Math.floor(Math.random() * available.length)];

  // Update seen list
  seen.push(question.id);

  return {
    question,
    seenQuestions: seen
  };
}

/**
 * Determine if SMS should include a question (probabilistic gate)
 * @returns {boolean}
 */
export function shouldIncludeSmsQuestion() {
  return Math.random() < SMS_QUESTION_RATE;
}

/**
 * Format question for email
 * @param {Object} question - Question object
 * @returns {string}
 */
export function formatEmailQuestion(question) {
  const prefix = getEmailPrefix();
  return `${prefix} ${question.full}`;
}

/**
 * Format question for SMS (with char cap validation)
 * @param {Object} question - Question object
 * @returns {string|null} - Returns null if exceeds cap
 */
export function formatSmsQuestion(question) {
  const prefix = getSmsPrefix();
  const formatted = `${prefix} ${question.short}`;

  if (formatted.length > SMS_QUESTION_MAX_CHARS) {
    return null;
  }

  return formatted;
}
