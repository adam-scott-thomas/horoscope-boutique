/**
 * SMS Module - VoIP.ms Integration (Node.js)
 * Sends SMS messages via VoIP.ms REST API with message splitting support
 */

const https = require('https');

const SMS_MAX_LENGTH = 160;

/**
 * Split a long message into SMS-sized segments
 * @param {string} message - The full message text
 * @param {number} maxLength - Maximum length per segment
 * @returns {string[]} Array of message segments
 */
function splitMessage(message, maxLength = SMS_MAX_LENGTH) {
  if (message.length <= maxLength) {
    return [message];
  }
  
  const segments = [];
  const words = message.split(' ');
  let currentSegment = '';
  
  for (const word of words) {
    const testSegment = currentSegment + (currentSegment ? ' ' : '') + word;
    
    if (testSegment.length <= maxLength) {
      currentSegment = testSegment;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = word;
      
      // If a single word is longer than maxLength, split it
      while (currentSegment.length > maxLength) {
        segments.push(currentSegment.substring(0, maxLength));
        currentSegment = currentSegment.substring(maxLength);
      }
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}

/**
 * Send SMS via VoIP.ms API
 * @param {Object} params - SMS parameters
 * @param {string} params.apiUsername - VoIP.ms API username
 * @param {string} params.apiPassword - VoIP.ms API password
 * @param {string} params.did - Sender phone number
 * @param {string} params.dst - Destination phone number
 * @param {string} params.message - Message content
 * @param {boolean} params.splitLongMessages - Auto-split long messages
 * @returns {Promise<Object>} Sending result
 */
async function sendSMS({
  apiUsername,
  apiPassword,
  did,
  dst,
  message,
  splitLongMessages = true
}) {
  try {
    // Clean phone numbers
    did = did.replace(/\D/g, '');
    dst = dst.replace(/\D/g, '');
    
    if (did.length < 10 || dst.length < 10) {
      throw new Error('Invalid phone number format. Must be at least 10 digits.');
    }
    
    // Split message if needed
    const segments = splitLongMessages ? splitMessage(message) : [message];
    console.log(`Message split into ${segments.length} segment(s)`);
    
    const results = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentMsg = segments.length > 1 ? `[${i+1}/${segments.length}] ${segment}` : segment;
      
      const params = new URLSearchParams({
        api_username: apiUsername,
        api_password: apiPassword,
        method: 'sendSMS',
        did: did,
        dst: dst,
        message: segmentMsg
      });
      
      console.log(`Sending segment ${i+1}/${segments.length} to ${dst}`);
      
      const url = `https://voip.ms/api/v1/rest.php?${params}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(`VoIP.ms API error: ${data.status}`);
      }
      
      results.push({
        segment: i + 1,
        status: 'success',
        sms_id: data.sms || 'unknown'
      });
      
      console.log(`Segment ${i+1} sent successfully. SMS ID: ${data.sms}`);
    }
    
    return {
      success: true,
      segments_sent: results.length,
      total_segments: segments.length,
      results: results,
      destination: dst
    };
    
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return {
      success: false,
      error: error.message,
      destination: dst
    };
  }
}

/**
 * Format single horoscope for SMS
 * @param {Object} data - Horoscope data
 * @returns {string} Formatted SMS message
 */
function formatSingleHoroscopeSMS(data) {
  let msg = `✨ Daily Horoscope for ${data.name} ✨\n\n`;
  msg += `${data.horoscope}\n\n`;
  msg += `🎨 Lucky Color: ${data.lucky_color}\n`;
  msg += `💫 Mantra: ${data.mantra}\n`;
  msg += `🎯 Focus: ${data.daily_focus}`;
  return msg;
}

/**
 * Format couples horoscope for SMS
 * @param {Object} data - Couples horoscope data
 * @returns {string} Formatted SMS message
 */
function formatCouplesHoroscopeSMS(data) {
  let msg = `💕 Couples Horoscope 💕\n`;
  msg += `${data.name_1} & ${data.name_2}\n\n`;
  msg += `${data.couples_horoscope}\n\n`;
  msg += `🎨 Lucky Color: ${data.lucky_color}\n`;
  msg += `💫 Shared Mantra: ${data.shared_mantra}\n`;
  msg += `💞 Focus: ${data.relationship_focus}`;
  return msg;
}

/**
 * Send horoscope via SMS
 * @param {Object} params - Parameters
 * @param {string} params.apiUsername - VoIP.ms username
 * @param {string} params.apiPassword - VoIP.ms password
 * @param {string} params.did - Sender number
 * @param {string} params.dst - Destination number
 * @param {Object} params.horoscopeData - Horoscope data
 * @param {boolean} params.isCouples - Is couples horoscope
 * @returns {Promise<Object>} Sending result
 */
async function sendHoroscopeSMS({
  apiUsername,
  apiPassword,
  did,
  dst,
  horoscopeData,
  isCouples = false
}) {
  const message = isCouples 
    ? formatCouplesHoroscopeSMS(horoscopeData)
    : formatSingleHoroscopeSMS(horoscopeData);
  
  console.log(`Sending horoscope SMS to ${dst}`);
  console.log(`Message length: ${message.length} characters`);
  
  return await sendSMS({
    apiUsername,
    apiPassword,
    did,
    dst,
    message,
    splitLongMessages: true
  });
}

/**
 * Send horoscope to multiple phone numbers
 * @param {Object} params - Parameters
 * @param {string[]} params.destinations - Phone numbers
 * @param {Object} params.horoscopeData - Horoscope data
 * @param {boolean} params.isCouples - Is couples horoscope
 * @returns {Promise<Object>} Results for all destinations
 */
async function sendToMultiple({
  apiUsername,
  apiPassword,
  did,
  destinations,
  horoscopeData,
  isCouples = false
}) {
  const results = [];
  
  for (const dst of destinations) {
    const result = await sendHoroscopeSMS({
      apiUsername,
      apiPassword,
      did,
      dst,
      horoscopeData,
      isCouples
    });
    results.push(result);
  }
  
  const successCount = results.filter(r => r.success).length;
  
  return {
    total_sent: destinations.length,
    successful: successCount,
    failed: destinations.length - successCount,
    results: results
  };
}

// Export functions
module.exports = {
  splitMessage,
  sendSMS,
  formatSingleHoroscopeSMS,
  formatCouplesHoroscopeSMS,
  sendHoroscopeSMS,
  sendToMultiple
};

// Example usage
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('SMS MODULE TEST (Node.js)');
  console.log('='.repeat(60));
  
  // Test message splitting
  const longMessage = 'This is a very long message that needs to be split into multiple segments. '.repeat(5);
  const segments = splitMessage(longMessage);
  console.log(`\nOriginal message length: ${longMessage.length} characters`);
  console.log(`Split into ${segments.length} segments:`);
  segments.forEach((seg, i) => {
    console.log(`  Segment ${i+1}: ${seg.length} characters`);
  });
  
  // Test formatting
  console.log('\n' + '='.repeat(60));
  console.log('FORMATTING TEST');
  console.log('='.repeat(60));
  
  const singleData = {
    name: 'Emma',
    sign: 'Pisces',
    horoscope: 'Today brings beautiful energy for growth and connection.',
    lucky_color: 'Aquamarine',
    mantra: 'I embrace growth with an open heart',
    daily_focus: 'Self-care'
  };
  
  const formatted = formatSingleHoroscopeSMS(singleData);
  console.log('\nFormatted Single Horoscope SMS:');
  console.log(formatted);
  console.log(`\nLength: ${formatted.length} characters`);
  
  console.log('\n' + '='.repeat(60));
  console.log('NOTE: To actually send SMS, provide your VoIP.ms credentials');
  console.log('='.repeat(60));
}
