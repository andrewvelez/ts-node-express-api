const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data'); // Correct package for multipart
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer();

app.use(cors({
  origin: [
    'https://travelsolutionsri.com',
    'https://www.travelsolutionsri.com',
    'https://travelsolutionsri.com'
  ],
  credentials: true // If you need to send cookies/sessions
}));

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
      <title>EmailJS Proxy API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .endpoint { background: #f5f7fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4a6fa5; }
        pre { 
          background: white;
       border: 1px solid #ccc;
       color: #333;
          padding: 20px; 
          border-radius: 6px; 
          overflow-x: auto; 
          margin: 10px 0; 
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        .method { display: inline-block; background: #4a5568; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.9em; margin-right: 8px; }
        .path { color: #2b6cb0; }
        .note { background: #feebc8; padding: 10px; border-radius: 6px; border-left: 4px solid #dd6b20; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h1>✉️ EmailJS Proxy API Server</h1>
      <p><strong>Status:</strong> <span style="color: #38a169;">● Healthy</span></p>
      <p>This server acts as a secure proxy for sending emails via EmailJS, handling CORS and API key security.</p>
      
      <div class="note">
        <strong>📌 Important:</strong> Your API keys are stored server-side and injected automatically. 
        Only send <code>service_id</code>, <code>template_id</code>, and <code>template_params</code> from your frontend.
      </div>
      
      <div class="endpoint">
        <h3><span class="method">POST</span> <span class="path">/email/send</span></h3>
        <p><strong>Description:</strong> Send an email through the EmailJS service.</p>
        
        <p><strong>Required fields in your FormData:</strong></p>
        <ul>
          <li><code>service_id</code> (Your EmailJS service ID)</li>
          <li><code>template_id</code> (Your EmailJS template ID)</li>
          <li><code>template_params[field_name]</code> (Your dynamic template fields)</li>
        </ul>
        
        <p><strong>Example frontend JavaScript:</strong></p>
        <pre><code>// Create FormData from your HTML form
const formElement = document.getElementById('contact-form');
const formData = new FormData(formElement);

// Add the required EmailJS identifiers
formData.append('service_id', 'your_service_id_here');
formData.append('template_id', 'your_template_id_here');

// Send to this API
fetch('https://api.travelsolutionsri.com/email/send', {
  method: 'POST',
  body: formData // Browser sets Content-Type to multipart/form-data automatically
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  alert('Message sent successfully!');
})
.catch(error => {
  console.error('Error:', error);
  alert('Failed to send message.');
});</code></pre>
        
        <p><strong>📝 Note:</strong> The server automatically adds your <code>user_id</code> (public key) and <code>accessToken</code> (private key) from environment variables.</p>
      </div>
      
      <div class="endpoint">
        <h3><span class="method">GET</span> <span class="path">/</span></h3>
        <p><strong>Description:</strong> This documentation page (returns JSON for API clients).</p>
        <p><strong>Try it:</strong> <a href="/?format=json" style="color: #2b6cb0;">View raw JSON response</a></p>
      </div>
      
      <p><small>Server time: ${new Date().toISOString()}</small></p>
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
          path: '/email/send',
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

app.post('/email/send', upload.none(), async (req, res) => {
  try {

    const formData = new FormData();
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }
    formData.append('service_id', process.env.EMAILJS_SERVICE_ID);
    formData.append('template_id', process.env.EMAILJS_TEMPLATE_ID);
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
    const status = error.response?.status;
    const data = error.response?.data || { error: error.message };
    res.status(status).json(data);
  }
});

app.listen(PORT);