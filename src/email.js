/**
 * Email Service Integration (Mailgun)
 * Handles email delivery via Mailgun API
 *
 * IMPORTANT: Supports both US and EU Mailgun regions.
 * Set MAILGUN_REGION=eu for EU accounts, or leave unset/us for US accounts.
 */

/**
 * Get the Mailgun API base URL based on region
 * @param {string} region - 'us' or 'eu' (defaults to 'us')
 * @returns {string} - Mailgun API base URL
 */
function getMailgunBaseUrl(region) {
  const normalizedRegion = (region || 'us').toLowerCase().trim();
  if (normalizedRegion === 'eu') {
    return 'https://api.eu.mailgun.net/v3';
  }
  return 'https://api.mailgun.net/v3';
}

/**
 * Send email via Mailgun
 * @param {Object} env - Environment variables
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @returns {Promise<Object>} - Mailgun response
 */
export async function sendEmail(env, to, subject, htmlBody) {
  if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN || !env.MAILGUN_FROM) {
    throw new Error('Mailgun environment variables not configured');
  }

  const formData = new FormData();
  formData.append('from', env.MAILGUN_FROM);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', htmlBody);

  const baseUrl = getMailgunBaseUrl(env.MAILGUN_REGION);

  const response = await fetch(
    `${baseUrl}/${env.MAILGUN_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`api:${env.MAILGUN_API_KEY}`)
      },
      body: formData
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Send horoscope email with retry logic
 * @param {Object} env - Environment variables
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML content
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Result object
 */
export async function sendHoroscopeEmail(env, email, subject, htmlBody, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmail(env, email, subject, htmlBody);
      return {
        success: true,
        provider: 'mailgun',
        message_id: result.id,
        attempt: attempt
      };
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    attempts: maxRetries
  };
}
