console.log("🚀 server.js loaded, NODE_ENV=", process.env.NODE_ENV);

const express = require('express');
const path    = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();

// 1) Serve everything in /public
app.use(express.static(path.join(__dirname, 'public')));

// 2) Parse JSON bodies for contact form
app.use(bodyParser.json());

// 3) Mail transporter (env vars must be set in .env or Glitch console)
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 4) Contact endpoint
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to:   process.env.CONTACT_EMAIL,
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5) Fallback: serve index.html for any other GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 6) Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
