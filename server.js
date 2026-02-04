const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data'); // Correct package for multipart
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer();

app.use(cors());

// ========================
// HEALTH CHECK ENDPOINT (API DOCUMENTATION)
// ========================
app.get('/', (req, res) => {
  const apiDocumentation = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EmailJS Proxy Server',
    description: 'A secure proxy server for sending emails via EmailJS with CORS support',
    version: '1.0.0',
    endpoints: {
      // Main endpoint for sending emails
      sendEmail: {
        method: 'POST',
        path: '/api/email/send',
        description: 'Send an email through EmailJS',
        requiredFields: ['service_id', 'template_id'],
        exampleRequest: {
          service_id: 'your_service_id',
          template_id: 'your_template_id',
          template_params: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello from the contact form!'
          }
        },
        notes: 'API keys (user_id, accessToken) are added server-side from environment variables'
      },
      // The health check endpoint itself
      healthCheck: {
        method: 'GET',
        path: '/',
        description: 'This endpoint - returns API documentation and server status'
      }
    },
    security: {
      note: 'EmailJS API keys are stored server-side in environment variables',
      envVariables: ['EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_URL']
    },
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(apiDocumentation);
});

app.post('/api/email/send', upload.none(), async (req, res) => {
  try {

    const formData = new FormData();
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }
    formData.append('user_id', process.env.EMAILJS_PUBLIC_KEY);
    formData.append('accessToken', process.env.EMAILJS_PRIVATE_KEY);

    const response = await axios.post(
      process.env.EMAILJS_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    res.status(response.status).json(response.data);

  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    res.status(status).json(data);
  }
});

app.listen(PORT);