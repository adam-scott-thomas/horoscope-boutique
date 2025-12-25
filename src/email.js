/**
 * Email Service Integration (AWS SES)
 * Handles email delivery via AWS Simple Email Service
 */

/**
 * Create HMAC-SHA256 signature
 */
async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return new Uint8Array(signature);
}

/**
 * Create SHA-256 hash
 */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert Uint8Array to hex string
 */
function toHex(buffer) {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get AWS Signature Version 4 signing key
 */
async function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate = await hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Sign AWS request with Signature Version 4
 */
async function signAwsRequest(method, url, headers, body, accessKeyId, secretAccessKey, region, service) {
  const urlObj = new URL(url);
  const host = urlObj.host;
  const path = urlObj.pathname;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Create canonical request
  const signedHeaders = 'content-type;host;x-amz-date';
  const payloadHash = await sha256(body);

  const canonicalRequest = [
    method,
    path,
    '', // query string
    `content-type:${headers['Content-Type']}\n`,
    `host:${host}\n`,
    `x-amz-date:${amzDate}\n`,
    '',
    signedHeaders,
    payloadHash
  ].join('\n');

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // Calculate signature
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));

  // Create authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...headers,
    'Host': host,
    'X-Amz-Date': amzDate,
    'Authorization': authorization
  };
}

/**
 * Send email via AWS SES
 * @param {Object} env - Environment variables
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @returns {Promise<Object>} - SES response
 */
export async function sendEmail(env, to, subject, htmlBody) {
  if (!env.AWS_SES_ACCESS_KEY_ID || !env.AWS_SES_SECRET_ACCESS_KEY || !env.AWS_SES_FROM) {
    throw new Error('AWS SES environment variables not configured');
  }

  const region = env.AWS_SES_REGION || 'us-east-1';
  const endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;

  const emailPayload = {
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          }
        }
      }
    },
    Destination: {
      ToAddresses: [to]
    },
    FromEmailAddress: env.AWS_SES_FROM
  };

  const body = JSON.stringify(emailPayload);
  const headers = {
    'Content-Type': 'application/json'
  };

  const signedHeaders = await signAwsRequest(
    'POST',
    endpoint,
    headers,
    body,
    env.AWS_SES_ACCESS_KEY_ID,
    env.AWS_SES_SECRET_ACCESS_KEY,
    region,
    'ses'
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: signedHeaders,
    body: body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AWS SES API error (${response.status}): ${errorText}`);
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
        provider: 'ses',
        message_id: result.MessageId,
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
