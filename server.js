const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Proxy server is running',
    endpoints: {
      proxy: '/api/proxy?url=YOUR_TARGET_URL',
      github: '/api/github/* (example)',
      custom: '/api/custom (POST method)'
    },
    usage: 'Use /api/proxy?url=https://api.example.com/data to proxy requests'
  });
});

// Simple proxy endpoint (GET requests)
app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ 
        error: 'Missing URL parameter',
        example: '/api/proxy?url=https://api.example.com/data' 
      });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Forward the request
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      headers: {
        ...req.headers,
        'host': new URL(targetUrl).host,
        'origin': new URL(targetUrl).origin,
        'referer': targetUrl
      },
      params: req.query,
      responseType: 'stream',
      timeout: 10000 // 10 second timeout
    });

    // Forward headers from target server
    res.status(response.status);
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    // Pipe the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy error:', error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    
    res.status(status).json({
      error: 'Proxy request failed',
      message: message,
      url: req.query.url
    });
  }
});

// Example: GitHub API proxy (fixed endpoint)
app.get('/api/github/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const response = await axios.get(`https://api.github.com/users/${user}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch GitHub data',
      message: error.message
    });
  }
});

// Advanced proxy endpoint (handles multiple HTTP methods)
app.all('/api/custom', async (req, res) => {
  try {
    const { targetUrl, method = 'GET', headers = {}, body = null } = req.body;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'targetUrl is required in request body' });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const config = {
      method: method.toUpperCase(),
      url: targetUrl,
      headers: {
        ...headers,
        'user-agent': req.headers['user-agent'] || 'Proxy-Server/1.0'
      },
      timeout: 15000,
      validateStatus: null // Don't throw on HTTP error status
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.data = body;
    }

    const response = await axios(config);

    // Forward the response
    res.status(response.status);
    
    // Copy headers, excluding security-sensitive ones
    const headersToExclude = ['set-cookie', 'content-encoding', 'content-length'];
    Object.keys(response.headers).forEach(key => {
      if (!headersToExclude.includes(key.toLowerCase())) {
        res.setHeader(key, response.headers[key]);
      }
    });

    res.send(response.data);

  } catch (error) {
    console.error('Custom proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/`);
});