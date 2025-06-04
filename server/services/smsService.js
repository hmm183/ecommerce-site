require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.FAST2SMS_API_KEY;

exports.sendSms = async (phoneNumber, message) => {
  // Ensure the API key is set before proceeding
  if (!API_KEY) {
    throw new Error("Fast2SMS API Key is missing.");
  }

  const url = 'https://www.fast2sms.com/dev/bulkV2';

  // For sending a general message, use the 'message' field and 'q' route.
  // The 'variables_values' field is typically for template variables, especially with DLT routes.
  const payload = {
    message: message, // The actual message content
    route: 'q',       // 'q' for Quick SMS (general messages without DLT templates)
    numbers: phoneNumber
  };

  const headers = {
    authorization: API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const res = await axios.post(url, payload, { headers });
    return res.data;
  } catch (error) {
    throw new Error(`Failed to send SMS: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
  }
};
// require('dotenv').config();

// const axios = require('axios'); // axios is no longer strictly needed if only mocking, but kept for consistency.

// const API_KEY = process.env.FAST2SMS_API_KEY; // Kept for consistency, though not used in mock.

// /**
//  * Sends an SMS message using the Fast2SMS API.
//  * This version is configured to *always* mock the API call and log the SMS details to the console.
//  * It does not send actual SMS messages.
//  *
//  * @param {string} phoneNumber - The recipient's phone number (e.g., "9999999999").
//  * @param {string} message - The text content of the SMS message.
//  * @returns {Promise<object>} - A simulated successful Fast2SMS response.
//  */
// exports.sendSms = async (phoneNumber, message) => {
//   console.warn("MOCK SMS SEND: This function is currently configured to ONLY mock SMS sending.");
//   console.log(`  Simulating SMS to: ${phoneNumber}`);
//   console.log(`  Simulated Message: "${message}"`);
//   // Simulate a successful Fast2SMS response
//   return {
//     "return": true,
//     "request_id": "mock_request_id_" + Date.now(),
//     "message": ["Mock SMS sent successfully."]
//   };
// };
