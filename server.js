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

// In your server.js file, replace the current app.get('/', ...) with this:
app.get('/', (req, res) => {
  // Check if the request accepts HTML (browser) vs JSON (API client)
  const acceptsHTML = req.headers.accept && req.headers.accept.includes('text/html');

  if (acceptsHTML) {
    // Return HTML page for browsers
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EmailJS Proxy Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          h1 { color: #333; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
          code { background: #eee; padding: 2px 5px; }
          pre { background: #2d2d2d; color: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>✉️ EmailJS Proxy Server</h1>
        <p>A secure proxy server for sending emails via EmailJS with CORS support.</p>
        
        <div class="endpoint">
          <h2>📤 Send Email</h2>
          <p><strong>Method:</strong> <code>POST</code></p>
          <p><strong>Endpoint:</strong> <code>/api/email/send</code></p>
          <p><strong>Description:</strong> Send an email through EmailJS</p>
          
          <h3>Example Request:</h3>
          <pre><code>fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_id: 'your_service_id',
    template_id: 'your_template_id',
    template_params: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello!'
    }
  })
})</code></pre>
        </div>
        
        <div class="endpoint">
          <h2>📊 API Documentation (JSON)</h2>
          <p><strong>Method:</strong> <code>GET</code></p>
          <p><strong>Endpoint:</strong> <code>/</code></p>
          <p><strong>Description:</strong> Returns complete API documentation in JSON format</p>
          <p><a href="/?format=json">View raw JSON</a></p>
        </div>
        
        <p><small>Server status: <strong style="color: green;">● Healthy</strong></small></p>
      </body>
      </html>
    `);
  } else {
    // Return the existing JSON for API clients
    const apiDocumentation = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'EmailJS Proxy Server',
      description: 'A secure proxy server for sending emails via EmailJS with CORS support',
      version: '1.0.0',
      endpoints: {
        sendEmail: {
          method: 'POST',
          path: '/api/email/send',
          description: 'Send an email through EmailJS',
          requiredFields: ['service_id', 'template_id']
        },
        documentation: {
          method: 'GET',
          path: '/',
          description: 'Returns API documentation'
        }
      }
    };

    res.status(200).json(apiDocumentation);
  }
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