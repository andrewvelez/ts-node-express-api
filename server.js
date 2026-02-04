const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send-form';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EmailJS Proxy Server',
    endpoint: 'POST /api/email/send',
    usage: 'Send POST request with EmailJS parameters to this endpoint'
  });
});

// EmailJS proxy endpoint (POST only)
app.post('/api/email/send', async (req, res) => {
  try {
    const { service_id, template_id, user_id, template_params, accessToken } = req.body;
    
    // Validate required fields
    if (!service_id || !template_id || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['service_id', 'template_id', 'user_id'],
        received: req.body
      });
    }

    // Prepare EmailJS request
    const payload = {
      service_id,
      template_id,
      user_id,
      template_params: template_params || {},
      accessToken: accessToken || undefined
    };

    // Make request to EmailJS
    const response = await axios.post(EMAILJS_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': req.headers.origin || 'https://your-website.com',
        'User-Agent': req.headers['user-agent'] || 'EmailJS-Proxy/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    // Return EmailJS response
    res.status(response.status).json({
      success: true,
      message: 'Email sent successfully',
      data: response.data
    });

  } catch (error) {
    console.error('EmailJS proxy error:', error.message);
    
    // Extract error details from EmailJS response if available
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    
    res.status(status).json({
      success: false,
      error: 'Failed to send email',
      message: message,
      details: error.response?.data
    });
  }
});

// Error handling for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Use POST /api/email/send for sending emails'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✉️  EmailJS Proxy Server running on port ${PORT}`);
  console.log(`📤  Endpoint: POST http://localhost:${PORT}/api/email/send`);
  console.log(`📖  Test: http://localhost:${PORT}/`);
});