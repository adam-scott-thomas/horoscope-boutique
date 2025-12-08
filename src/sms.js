/**
 * SMS Service Integration (VoIP.ms or similar)
 * Handles SMS delivery with automatic message splitting
 */

/**
 * Send SMS via VoIP.ms API
 * @param {Object} env - Environment variables
 * @param {string} dst - Destination phone number (E.164 format)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - VoIP.ms API response
 */
export async function sendSMS(env, dst, message) {
  if (!env.VOIPMS_API_USERNAME || !env.VOIPMS_API_PASSWORD || !env.VOIPMS_DID) {
    throw new Error('VoIP.ms environment variables not configured');
  }

  const params = new URLSearchParams({
    api_username: env.VOIPMS_API_USERNAME,
    api_password: env.VOIPMS_API_PASSWORD,
    method: 'sendSMS',
    did: env.VOIPMS_DID,
    dst: dst.replace(/^\+/, ''), // Remove leading + for VoIP.ms
    message: message
  });

  const response = await fetch(`https://voip.ms/api/v1/rest.php?${params}`, {
    method: 'GET'
  });

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error(`VoIP.ms API error: ${data.status}`);
  }

  return data;
}

/**
 * Split long messages into SMS-sized chunks
 * Standard SMS is 160 characters, but we'll use 150 to be safe
 * @param {string} message - Long message
 * @param {number} maxLength - Max characters per message
 * @returns {Array<string>} - Array of message parts
 */
export function splitMessage(message, maxLength = 150) {
  if (message.length <= maxLength) {
    return [message];
  }

  const parts = [];
  let remaining = message;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    // Try to split at a space or punctuation near maxLength
    let splitIndex = maxLength;
    const searchStart = Math.max(0, maxLength - 50);
    const chunk = remaining.substring(searchStart, maxLength);
    const lastSpace = chunk.lastIndexOf(' ');
    const lastPeriod = chunk.lastIndexOf('.');
    const lastComma = chunk.lastIndexOf(',');

    const bestSplit = Math.max(lastSpace, lastPeriod, lastComma);
    if (bestSplit > 0) {
      splitIndex = searchStart + bestSplit + 1;
    }

    parts.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }

  return parts;
}

/**
 * Send SMS with automatic splitting and retry logic
 * @param {Object} env - Environment variables
 * @param {string} phone - Destination phone number (E.164)
 * @param {string} message - SMS message
 * @param {number} maxRetries - Maximum retry attempts per part
 * @returns {Promise<Object>} - Result object
 */
export async function sendHoroscopeSMS(env, phone, message, maxRetries = 3) {
  const parts = splitMessage(message);
  const results = [];

  for (let i = 0; i < parts.length; i++) {
    let lastError;
    let sent = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await sendSMS(env, phone, parts[i]);
        results.push({
          part: i + 1,
          total_parts: parts.length,
          success: true,
          sms_id: result.sms,
          attempt: attempt
        });
        sent = true;
        break;
      } catch (error) {
        lastError = error;
        console.error(`SMS part ${i + 1} attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    if (!sent) {
      results.push({
        part: i + 1,
        total_parts: parts.length,
        success: false,
        error: lastError.message,
        attempts: maxRetries
      });
      // Don't send remaining parts if one fails
      break;
    }
  }

  const allSucceeded = results.every(r => r.success);
  return {
    success: allSucceeded,
    parts_sent: results.filter(r => r.success).length,
    total_parts: parts.length,
    results: results
  };
}
