/**
 * Horoscope Boutique - Frontend JavaScript
 * Handles form submission and timezone detection
 */

// Common timezones for the select dropdown
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland'
];

// Detect user's timezone on page load
document.addEventListener('DOMContentLoaded', function() {
  detectTimezone();
  setupFormValidation();
  setupFormSubmission();
});

/**
 * Detect and populate timezone dropdown
 */
function detectTimezone() {
  const timezoneSelect = document.getElementById('timezone');

  // Detect user's timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Clear placeholder
  timezoneSelect.innerHTML = '';

  // Add detected timezone first
  const detectedOption = document.createElement('option');
  detectedOption.value = detectedTimezone;
  detectedOption.textContent = `${detectedTimezone} (Detected)`;
  detectedOption.selected = true;
  timezoneSelect.appendChild(detectedOption);

  // Add separator
  const separator = document.createElement('option');
  separator.disabled = true;
  separator.textContent = '──────────────';
  timezoneSelect.appendChild(separator);

  // Add common timezones
  COMMON_TIMEZONES.forEach(tz => {
    if (tz !== detectedTimezone) {
      const option = document.createElement('option');
      option.value = tz;
      option.textContent = tz;
      timezoneSelect.appendChild(option);
    }
  });
}

/**
 * Setup real-time form validation
 */
function setupFormValidation() {
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const birthdateInput = document.getElementById('birthdate');

  // Email validation
  emailInput.addEventListener('blur', function() {
    if (this.value && !isValidEmail(this.value)) {
      this.setCustomValidity('Please enter a valid email address');
    } else {
      this.setCustomValidity('');
    }
  });

  // Phone validation
  phoneInput.addEventListener('blur', function() {
    if (this.value && !isValidPhone(this.value)) {
      this.setCustomValidity('Please enter a valid phone number (e.g., +1 202 555 1234)');
    } else {
      this.setCustomValidity('');
    }
  });

  // Birthdate validation (must be in the past)
  birthdateInput.addEventListener('change', function() {
    const birthdate = new Date(this.value);
    const today = new Date();

    if (birthdate >= today) {
      this.setCustomValidity('Birthdate must be in the past');
    } else if (birthdate.getFullYear() < 1900) {
      this.setCustomValidity('Please enter a valid birthdate');
    } else {
      this.setCustomValidity('');
    }
  });

  // Set max date to today
  birthdateInput.max = new Date().toISOString().split('T')[0];
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
  const form = document.getElementById('signupForm');
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      phone: formData.get('phone'),
      birthdate: formData.get('birthdate'),
      first_name: formData.get('first_name') || null,
      timezone: formData.get('timezone'),
      delivery_method: formData.get('delivery_method'),
      consent_given: formData.get('consent') === 'on'
    };

    // Validate consent
    if (!data.consent_given) {
      showMessage('Please agree to receive daily horoscope messages', 'error');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    showMessage('Creating your subscription...', 'loading');

    try {
      // Submit to API
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        showMessage(
          `Success! 🎉 Your first horoscope has been sent to your ${data.delivery_method === 'both' ? 'email and phone' : data.delivery_method}. ` +
          `You'll receive daily horoscopes at 9 AM ${data.timezone} time.`,
          'success'
        );
        form.reset();
        detectTimezone(); // Reset timezone
      } else {
        // Error from API
        showMessage(result.error || 'Something went wrong. Please try again.', 'error');
      }

    } catch (error) {
      console.error('Submission error:', error);
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get My Daily Horoscope';
    }
  });
}

/**
 * Show message to user
 */
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  // Auto-hide success messages after 10 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 10000);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic check)
 */
function isValidPhone(phone) {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Should start with + and have 10-15 digits
  const phoneRegex = /^\+?\d{10,15}$/;
  return phoneRegex.test(cleaned);
}
