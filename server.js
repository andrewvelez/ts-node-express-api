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