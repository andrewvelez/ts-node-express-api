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

app.post('/api/email/send', upload.none(), async (req, res) => {
  try {
    // 1. Create a proper FormData object for Node.js
    const formData = new FormData();
    
    // 2. Append ALL fields from the client request
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }
    
    // 3. Override with server-side credentials (secure)
    formData.append('user_id', process.env.EMAILJS_PUBLIC_KEY);
    formData.append('accessToken', process.env.EMAILJS_PRIVATE_KEY);

    // 4. Forward to EmailJS WITH correct headers
    const response = await axios.post(
      process.env.EMAILJS_URL,
      formData, // Send the FormData object directly
      {
        headers: {
          // Axios will automatically set:
          // 'Content-Type': 'multipart/form-data; boundary=...'
          // with the correct boundary from the formData object
          ...formData.getHeaders() // This is the crucial part
        }
      }
    );
    
    // 5. Pass response directly to client
    res.status(response.status).json(response.data);
    
  } catch (error) {
    // 6. Pass any error directly to client
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    res.status(status).json(data);
  }
});

app.listen(PORT);