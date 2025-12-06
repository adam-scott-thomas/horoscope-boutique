/**
 * Email Module - Multi-Provider Support (Node.js)
 * Sends horoscope emails via SMTP, Mailgun, or SendGrid
 */

const nodemailer = require('nodemailer');

// HTML Email Templates
const HTML_TEMPLATE_SINGLE = (data) => `
<!DOCTYPE html>
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
</html>
`;

const HTML_TEMPLATE_COUPLES = (data) => `
<!DOCTYPE html>
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
</html>
`;

/**
 * Format plain text single horoscope
 * @param {Object} data - Horoscope data
 * @returns {string} Plain text message
 */
function formatPlainTextSingle(data) {
  let text = `✨ YOUR DAILY HOROSCOPE ✨\n\n`;
  text += `Dear ${data.name},\n\n`;
  text += `${data.horoscope}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🎨 Lucky Color: ${data.lucky_color}\n`;
  text += `💫 Today's Mantra: "${data.mantra}"\n`;
  text += `🎯 Daily Focus: ${data.daily_focus}\n\n`;
  text += `Wishing you a beautiful day ahead! 💜`;
  return text;
}

/**
 * Format plain text couples horoscope
 * @param {Object} data - Couples horoscope data
 * @returns {string} Plain text message
 */
function formatPlainTextCouples(data) {
  let text = `💕 YOUR COUPLES HOROSCOPE 💕\n\n`;
  text += `Dear ${data.name_1} & ${data.name_2},\n\n`;
  text += `${data.couples_horoscope}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🎨 Lucky Color: ${data.lucky_color}\n`;
  text += `💫 Shared Mantra: "${data.shared_mantra}"\n`;
  text += `💞 Relationship Focus: ${data.relationship_focus}\n\n`;
  text += `Wishing you both love and happiness! ❤️`;
  return text;
}

/**
 * Send email via SMTP
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} Sending result
 */
async function sendEmailSMTP({
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPassword,
  fromEmail,
  toEmail,
  subject,
  htmlBody,
  textBody,
  useTLS = true
}) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });
    
    console.log('Email sent successfully via SMTP:', info.messageId);
    
    return {
      success: true,
      provider: 'smtp',
      recipient: toEmail,
      message_id: info.messageId
    };
    
  } catch (error) {
    console.error('SMTP error:', error.message);
    return {
      success: false,
      provider: 'smtp',
      error: error.message,
      recipient: toEmail
    };
  }
}

/**
 * Send email via Mailgun API
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} Sending result
 */
async function sendEmailMailgun({
  apiKey,
  domain,
  fromEmail,
  toEmail,
  subject,
  htmlBody,
  textBody
}) {
  try {
    const formData = new FormData();
    formData.append('from', fromEmail);
    formData.append('to', toEmail);
    formData.append('subject', subject);
    formData.append('text', textBody);
    formData.append('html', htmlBody);
    
    const auth = Buffer.from(`api:${apiKey}`).toString('base64');
    
    const response = await fetch(
      `https://api.mailgun.net/v3/${domain}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Mailgun error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Email sent successfully via Mailgun:', data.id);
    
    return {
      success: true,
      provider: 'mailgun',
      recipient: toEmail,
      message_id: data.id
    };
    
  } catch (error) {
    console.error('Mailgun error:', error.message);
    return {
      success: false,
      provider: 'mailgun',
      error: error.message,
      recipient: toEmail
    };
  }
}

/**
 * Send email via SendGrid API
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} Sending result
 */
async function sendEmailSendGrid({
  apiKey,
  fromEmail,
  toEmail,
  subject,
  htmlBody,
  textBody
}) {
  try {
    const payload = {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail },
      subject: subject,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html', value: htmlBody }
      ]
    };
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.status}`);
    }
    
    console.log('Email sent successfully via SendGrid');
    
    return {
      success: true,
      provider: 'sendgrid',
      recipient: toEmail,
      status_code: response.status
    };
    
  } catch (error) {
    console.error('SendGrid error:', error.message);
    return {
      success: false,
      provider: 'sendgrid',
      error: error.message,
      recipient: toEmail
    };
  }
}

/**
 * Send horoscope email using specified provider
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} Sending result
 */
async function sendHoroscopeEmail({
  provider,
  toEmail,
  horoscopeData,
  isCouples = false,
  ...providerConfig
}) {
  try {
    // Format email content
    const subject = isCouples ? 'Your Couples Horoscope' : 'Your Daily Horoscope';
    const htmlBody = isCouples 
      ? HTML_TEMPLATE_COUPLES(horoscopeData)
      : HTML_TEMPLATE_SINGLE(horoscopeData);
    const textBody = isCouples
      ? formatPlainTextCouples(horoscopeData)
      : formatPlainTextSingle(horoscopeData);
    
    // Send via selected provider
    if (provider === 'smtp') {
      return await sendEmailSMTP({
        smtpHost: providerConfig.smtpHost,
        smtpPort: providerConfig.smtpPort,
        smtpUser: providerConfig.smtpUser,
        smtpPassword: providerConfig.smtpPassword,
        fromEmail: providerConfig.fromEmail,
        toEmail,
        subject,
        htmlBody,
        textBody,
        useTLS: providerConfig.useTLS !== false
      });
    }
    else if (provider === 'mailgun') {
      return await sendEmailMailgun({
        apiKey: providerConfig.apiKey,
        domain: providerConfig.domain,
        fromEmail: providerConfig.fromEmail,
        toEmail,
        subject,
        htmlBody,
        textBody
      });
    }
    else if (provider === 'sendgrid') {
      return await sendEmailSendGrid({
        apiKey: providerConfig.apiKey,
        fromEmail: providerConfig.fromEmail,
        toEmail,
        subject,
        htmlBody,
        textBody
      });
    }
    else {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
  } catch (error) {
    console.error('Error sending horoscope email:', error.message);
    return {
      success: false,
      error: error.message,
      recipient: toEmail
    };
  }
}

/**
 * Send horoscope to multiple email addresses
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} Results for all recipients
 */
async function sendToMultipleEmails({
  provider,
  recipients,
  horoscopeData,
  isCouples = false,
  ...providerConfig
}) {
  const results = [];
  
  for (const email of recipients) {
    const result = await sendHoroscopeEmail({
      provider,
      toEmail: email,
      horoscopeData,
      isCouples,
      ...providerConfig
    });
    results.push(result);
  }
  
  const successCount = results.filter(r => r.success).length;
  
  return {
    total_sent: recipients.length,
    successful: successCount,
    failed: recipients.length - successCount,
    results: results
  };
}

// Export functions
module.exports = {
  HTML_TEMPLATE_SINGLE,
  HTML_TEMPLATE_COUPLES,
  formatPlainTextSingle,
  formatPlainTextCouples,
  sendEmailSMTP,
  sendEmailMailgun,
  sendEmailSendGrid,
  sendHoroscopeEmail,
  sendToMultipleEmails
};

// Example usage
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('EMAIL MODULE TEST (Node.js)');
  console.log('='.repeat(60));
  
  const singleData = {
    name: 'Emma',
    sign: 'Pisces',
    horoscope: 'Today brings beautiful energy for growth and connection.',
    lucky_color: 'Aquamarine',
    mantra: 'I embrace growth with an open heart',
    daily_focus: 'Self-care'
  };
  
  console.log('\nPlain Text Single Horoscope:');
  console.log(formatPlainTextSingle(singleData));
  
  const couplesData = {
    name_1: 'Alex',
    sign_1: 'Leo',
    name_2: 'Jordan',
    sign_2: 'Aquarius',
    couples_horoscope: 'Your combined energy creates magic today.',
    lucky_color: 'Purple',
    shared_mantra: 'Together, we are stronger',
    relationship_focus: 'Communication'
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('Plain Text Couples Horoscope:');
  console.log(formatPlainTextCouples(couplesData));
  
  console.log('\n' + '='.repeat(60));
  console.log('HTML templates are ready for both single and couples horoscopes');
  console.log('Configure your email provider to send!');
  console.log('='.repeat(60));
}
