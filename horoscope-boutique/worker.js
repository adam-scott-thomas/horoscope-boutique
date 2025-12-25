/**
 * Cloudflare Worker - Horoscope Generator API
 * Provides REST API endpoints and scheduled horoscope delivery
 */

// ========================================
// HOROSCOPE GENERATOR FUNCTIONS
// ========================================

const LUCKY_COLORS = {
  aries: ['Red', 'Coral', 'Scarlet'],
  taurus: ['Green', 'Pink', 'Emerald'],
  gemini: ['Yellow', 'Light Blue', 'Silver'],
  cancer: ['White', 'Silver', 'Pale Blue'],
  leo: ['Gold', 'Orange', 'Purple'],
  virgo: ['Navy Blue', 'Grey', 'Beige'],
  libra: ['Pink', 'Light Blue', 'Lavender'],
  scorpio: ['Deep Red', 'Black', 'Burgundy'],
  sagittarius: ['Purple', 'Royal Blue', 'Turquoise'],
  capricorn: ['Brown', 'Dark Green', 'Charcoal'],
  aquarius: ['Electric Blue', 'Silver', 'Turquoise'],
  pisces: ['Sea Green', 'Lavender', 'Aquamarine']
};

const MANTRAS = [
  'I am exactly where I need to be',
  'I embrace growth with an open heart',
  'My energy attracts beautiful possibilities',
  'I trust the journey unfolding before me',
  'I am worthy of love, joy, and success',
  'Today, I choose peace and positivity',
  'I am aligned with my highest purpose',
  'I radiate confidence and inner strength'
];

const SHARED_MANTRAS = [
  'Together, we are stronger',
  'Our love grows deeper each day',
  'We choose each other, always',
  'Our bond is unbreakable and true',
  'We support each other\'s dreams',
  'Love guides our every step together'
];

const DAILY_FOCUS = [
  'Self-care', 'Communication', 'Creativity', 'Connection',
  'Gratitude', 'Joy', 'Growth', 'Balance'
];

const RELATIONSHIP_FOCUS = [
  'Communication', 'Trust', 'Intimacy', 'Adventure',
  'Growth', 'Support', 'Playfulness', 'Understanding'
];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateExampleSingleHoroscope(name, sign) {
  const templates = [
    `Dear ${name}, today's cosmic energy brings a wave of renewal and possibility. As a ${sign}, you're particularly attuned to the shifts happening around you, and this is your moment to shine. The universe is aligning to support your dreams, encouraging you to trust your intuition and take meaningful steps forward. You may feel a surge of creative inspiration or a desire to connect more deeply with those you cherish. Remember, growth sometimes asks you to be vulnerable, but that vulnerability is your strength. Embrace this day with an open heart, knowing you're exactly where you need to be. Your authentic self is your greatest gift, and the world is ready to receive it.`,
    
    `${name}, the stars are sending you powerful affirmations today. As a ${sign}, your natural gifts are being amplified by celestial energy that celebrates authenticity and courage. This is a time to honor your feelings, express your truth, and take bold steps toward what makes your soul sing. You might encounter situations that challenge you to grow, but these are invitations to discover your inner resilience. The connections you nurture today will flourish, and your presence brings warmth to everyone around you. Don't be afraid to ask for what you need—the universe supports those who honor their worth.`
  ];
  return randomChoice(templates);
}

function generateExampleCouplesHoroscope(name1, sign1, name2, sign2) {
  const templates = [
    `${name1} and ${name2}, your combined energy is creating something truly magical right now. As a ${sign1} and ${sign2} pairing, you bring complementary strengths that make your bond uniquely powerful. ${name1}, your natural ${sign1} qualities help ground this relationship in authenticity, while ${name2}, your ${sign2} energy adds depth and emotional richness. This period invites you both to celebrate how far you've come together and to dream even bigger about your shared future. You're entering a phase where communication flows more easily, where understanding deepens naturally, and where your love feels renewed. Any challenges you face become opportunities to strengthen your connection and prove to yourselves just how resilient your partnership is.`,
    
    `Beautiful souls ${name1} and ${name2}, the cosmic energy surrounding your relationship is radiant with possibility. Your ${sign1}-${sign2} connection brings together two different but harmonious energies, creating a partnership that's both stable and dynamic. ${name1}, you bring gifts of ${sign1} wisdom that help navigate life's complexities, while ${name2}, your ${sign2} spirit adds passion and spontaneity to your shared journey. Right now, the stars are highlighting the importance of mutual support and shared dreams. You're being reminded that your partnership is a safe haven where both of you can be completely authentic.`
  ];
  return randomChoice(templates);
}

function generateSingleHoroscope(name, sign, context = null) {
  const signLower = sign.toLowerCase();
  const horoscope = generateExampleSingleHoroscope(name, sign);
  
  return {
    name,
    sign,
    horoscope,
    lucky_color: randomChoice(LUCKY_COLORS[signLower] || ['Blue']),
    mantra: randomChoice(MANTRAS),
    daily_focus: randomChoice(DAILY_FOCUS),
    generated_at: new Date().toISOString()
  };
}

function generateCouplesHoroscope(name1, sign1, name2, sign2, context = null) {
  const sign1Lower = sign1.toLowerCase();
  const sign2Lower = sign2.toLowerCase();
  const horoscope = generateExampleCouplesHoroscope(name1, sign1, name2, sign2);
  
  const colors = [
    ...(LUCKY_COLORS[sign1Lower] || ['Blue']),
    ...(LUCKY_COLORS[sign2Lower] || ['Pink'])
  ];
  
  return {
    name_1: name1,
    sign_1: sign1,
    name_2: name2,
    sign_2: sign2,
    couples_horoscope: horoscope,
    lucky_color: randomChoice(colors),
    shared_mantra: randomChoice(SHARED_MANTRAS),
    relationship_focus: randomChoice(RELATIONSHIP_FOCUS),
    generated_at: new Date().toISOString()
  };
}

// ========================================
// SMS FUNCTIONS (VoIP.ms)
// ========================================

async function sendSMS(username, password, did, dst, message) {
  const params = new URLSearchParams({
    api_username: username,
    api_password: password,
    method: 'sendSMS',
    did: did,
    dst: dst,
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

function formatSingleHoroscopeSMS(data) {
  let msg = `✨ Daily Horoscope for ${data.name} ✨\n\n`;
  msg += `${data.horoscope}\n\n`;
  msg += `🎨 Lucky Color: ${data.lucky_color}\n`;
  msg += `💫 Mantra: ${data.mantra}\n`;
  msg += `🎯 Focus: ${data.daily_focus}`;
  return msg;
}

function formatCouplesHoroscopeSMS(data) {
  let msg = `💕 Couples Horoscope 💕\n`;
  msg += `${data.name_1} & ${data.name_2}\n\n`;
  msg += `${data.couples_horoscope}\n\n`;
  msg += `🎨 Lucky Color: ${data.lucky_color}\n`;
  msg += `💫 Shared Mantra: ${data.shared_mantra}\n`;
  msg += `💞 Focus: ${data.relationship_focus}`;
  return msg;
}

async function sendHoroscopeSMS(env, dst, horoscopeData, isCouples = false) {
  const message = isCouples 
    ? formatCouplesHoroscopeSMS(horoscopeData)
    : formatSingleHoroscopeSMS(horoscopeData);
  
  return await sendSMS(
    env.VOIPMS_API_USERNAME,
    env.VOIPMS_API_PASSWORD,
    env.VOIPMS_DID,
    dst,
    message
  );
}

// ========================================
// EMAIL FUNCTIONS
// ========================================

const HTML_TEMPLATE_SINGLE = (data) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✨ Your Daily Horoscope ✨</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Dear ${data.name},</h2>
                            <div style="color: #555; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                                ${data.horoscope}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #667eea; font-weight: bold;">🎨 Lucky Color:</span>
                                            <span style="color: #333; margin-left: 10px;">${data.lucky_color}</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #667eea; font-weight: bold;">💫 Today's Mantra:</span>
                                            <span style="color: #333; margin-left: 10px; font-style: italic;">"${data.mantra}"</span>
                                        </div>
                                        <div>
                                            <span style="color: #667eea; font-weight: bold;">🎯 Daily Focus:</span>
                                            <span style="color: #333; margin-left: 10px;">${data.daily_focus}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 14px; margin: 0;">
                                Wishing you a beautiful day ahead! 💜
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const HTML_TEMPLATE_COUPLES = (data) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💕 Your Couples Horoscope 💕</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Dear ${data.name_1} & ${data.name_2},</h2>
                            <div style="color: #555; line-height: 1.8; font-size: 16px; margin: 20px 0;">
                                ${data.couples_horoscope}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff5f8; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #f5576c; font-weight: bold;">🎨 Lucky Color:</span>
                                            <span style="color: #333; margin-left: 10px;">${data.lucky_color}</span>
                                        </div>
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #f5576c; font-weight: bold;">💫 Shared Mantra:</span>
                                            <span style="color: #333; margin-left: 10px; font-style: italic;">"${data.shared_mantra}"</span>
                                        </div>
                                        <div>
                                            <span style="color: #f5576c; font-weight: bold;">💞 Relationship Focus:</span>
                                            <span style="color: #333; margin-left: 10px;">${data.relationship_focus}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 14px; margin: 0;">
                                Wishing you both love and happiness! ❤️
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// ========================================
// AWS SES SIGNING FUNCTIONS
// ========================================

async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return new Uint8Array(signature);
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate = await hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, 'aws4_request');
}

async function signAwsRequest(method, url, headers, body, accessKeyId, secretAccessKey, region, service) {
  const urlObj = new URL(url);
  const host = urlObj.host;
  const path = urlObj.pathname;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const signedHeaders = 'content-type;host;x-amz-date';
  const payloadHash = await sha256(body);
  const canonicalRequest = [method, path, '', `content-type:${headers['Content-Type']}\n`, `host:${host}\n`, `x-amz-date:${amzDate}\n`, '', signedHeaders, payloadHash].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = [algorithm, amzDate, credentialScope, canonicalRequestHash].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...headers, 'Host': host, 'X-Amz-Date': amzDate, 'Authorization': authorization };
}

// ========================================
// EMAIL FUNCTIONS (AWS SES)
// ========================================

async function sendEmailSES(env, to, subject, htmlBody) {
  if (!env.AWS_SES_ACCESS_KEY_ID || !env.AWS_SES_SECRET_ACCESS_KEY || !env.AWS_SES_FROM) {
    throw new Error('AWS SES environment variables not configured');
  }

  const region = env.AWS_SES_REGION || 'us-east-1';
  const endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;

  const emailPayload = {
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
      }
    },
    Destination: { ToAddresses: [to] },
    FromEmailAddress: env.AWS_SES_FROM
  };

  const body = JSON.stringify(emailPayload);
  const headers = { 'Content-Type': 'application/json' };
  const signedHeaders = await signAwsRequest('POST', endpoint, headers, body, env.AWS_SES_ACCESS_KEY_ID, env.AWS_SES_SECRET_ACCESS_KEY, region, 'ses');

  const response = await fetch(endpoint, { method: 'POST', headers: signedHeaders, body: body });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AWS SES error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

async function sendHoroscopeEmail(env, email, horoscopeData, isCouples = false) {
  const subject = isCouples ? 'Your Couples Horoscope' : 'Your Daily Horoscope';
  const htmlBody = isCouples
    ? HTML_TEMPLATE_COUPLES(horoscopeData)
    : HTML_TEMPLATE_SINGLE(horoscopeData);

  return await sendEmailSES(env, email, subject, htmlBody);
}

// ========================================
// API ENDPOINTS
// ========================================

async function handleHoroscope(request) {
  try {
    const body = await request.json();
    const { name, sign, context } = body;
    
    if (!name || !sign) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, sign' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const horoscope = generateSingleHoroscope(name, sign, context);
    
    return new Response(JSON.stringify(horoscope), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCouples(request) {
  try {
    const body = await request.json();
    const { name_1, sign_1, name_2, sign_2, context } = body;
    
    if (!name_1 || !sign_1 || !name_2 || !sign_2) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name_1, sign_1, name_2, sign_2' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const horoscope = generateCouplesHoroscope(name_1, sign_1, name_2, sign_2, context);
    
    return new Response(JSON.stringify(horoscope), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSend(request, env) {
  try {
    const body = await request.json();
    const { name, sign, phone, context } = body;
    
    if (!name || !sign || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, sign, phone' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const horoscope = generateSingleHoroscope(name, sign, context);
    const smsResult = await sendHoroscopeSMS(env, phone, horoscope, false);
    
    return new Response(JSON.stringify({
      success: true,
      horoscope,
      sms_result: smsResult
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleEmail(request, env) {
  try {
    const body = await request.json();
    const { name, sign, email, context } = body;
    
    if (!name || !sign || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, sign, email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const horoscope = generateSingleHoroscope(name, sign, context);
    const emailResult = await sendHoroscopeEmail(env, email, horoscope, false);
    
    return new Response(JSON.stringify({
      success: true,
      horoscope,
      email_result: emailResult
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCouplesSend(request, env) {
  try {
    const body = await request.json();
    const { name_1, sign_1, name_2, sign_2, phone_1, phone_2, email_1, email_2, context } = body;
    
    if (!name_1 || !sign_1 || !name_2 || !sign_2) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields for couples' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const horoscope = generateCouplesHoroscope(name_1, sign_1, name_2, sign_2, context);
    const results = { success: true, horoscope };
    
    // Send SMS if phone numbers provided
    if (phone_1 || phone_2) {
      const phones = [phone_1, phone_2].filter(Boolean);
      const smsResults = [];
      
      for (const phone of phones) {
        try {
          const smsResult = await sendHoroscopeSMS(env, phone, horoscope, true);
          smsResults.push({ phone, result: smsResult });
        } catch (error) {
          smsResults.push({ phone, error: error.message });
        }
      }
      
      results.sms_results = smsResults;
    }
    
    // Send emails if addresses provided
    if (email_1 || email_2) {
      const emails = [email_1, email_2].filter(Boolean);
      const emailResults = [];
      
      for (const email of emails) {
        try {
          const emailResult = await sendHoroscopeEmail(env, email, horoscope, true);
          emailResults.push({ email, result: emailResult });
        } catch (error) {
          emailResults.push({ email, error: error.message });
        }
      }
      
      results.email_results = emailResults;
    }
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ========================================
// SCHEDULED HANDLER
// ========================================

async function handleScheduled(event, env) {
  try {
    const deliveryMode = env.DELIVERY_MODE || 'sms';
    console.log(`Running scheduled horoscope delivery. Mode: ${deliveryMode}`);
    
    const isCouplesMode = deliveryMode.startsWith('couple_');
    
    if (isCouplesMode) {
      // Couples mode
      const horoscope = generateCouplesHoroscope(
        env.COUPLE_NAME_1,
        env.COUPLE_SIGN_1,
        env.COUPLE_NAME_2,
        env.COUPLE_SIGN_2
      );
      
      const sendSMS = deliveryMode.includes('sms');
      const sendEmail = deliveryMode.includes('email');
      
      if (sendSMS) {
        const phones = [env.COUPLE_PHONE_1, env.COUPLE_PHONE_2].filter(Boolean);
        for (const phone of phones) {
          await sendHoroscopeSMS(env, phone, horoscope, true);
        }
      }
      
      if (sendEmail) {
        const emails = [env.COUPLE_EMAIL_1, env.COUPLE_EMAIL_2].filter(Boolean);
        for (const email of emails) {
          await sendHoroscopeEmail(env, email, horoscope, true);
        }
      }
    } else {
      // Single mode
      const horoscope = generateSingleHoroscope(
        env.RECIPIENT_NAME,
        env.RECIPIENT_SIGN
      );
      
      if (deliveryMode === 'sms' || deliveryMode === 'both') {
        await sendHoroscopeSMS(env, env.RECIPIENT_PHONE, horoscope, false);
      }
      
      if (deliveryMode === 'email' || deliveryMode === 'both') {
        await sendHoroscopeEmail(env, env.RECIPIENT_EMAIL, horoscope, false);
      }
    }
    
    console.log('Scheduled horoscope delivery completed successfully');
  } catch (error) {
    console.error('Error in scheduled delivery:', error);
  }
}

// ========================================
// MAIN WORKER EXPORT
// ========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // Route handling
    if (url.pathname === '/horoscope' && request.method === 'POST') {
      return handleHoroscope(request);
    }
    
    if (url.pathname === '/couples' && request.method === 'POST') {
      return handleCouples(request);
    }
    
    if (url.pathname === '/send' && request.method === 'POST') {
      return handleSend(request, env);
    }
    
    if (url.pathname === '/email' && request.method === 'POST') {
      return handleEmail(request, env);
    }
    
    if (url.pathname === '/couples/send' && request.method === 'POST') {
      return handleCouplesSend(request, env);
    }
    
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        service: 'Positive Horoscope Generator',
        endpoints: {
          'POST /horoscope': 'Generate single horoscope',
          'POST /couples': 'Generate couples horoscope',
          'POST /send': 'Generate and send single horoscope via SMS',
          'POST /email': 'Generate and send single horoscope via email',
          'POST /couples/send': 'Generate and send couples horoscope'
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...headers }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  }
};
