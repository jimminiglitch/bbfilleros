// server.js
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');
const nodemailer = require('nodemailer');

// Mail transporter (configure these in your .env or Glitch console)
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// MIME types for static files
const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4',
  '.json': 'application/json',
  // add more as needed
};

// Serve files from /public
function serveStatic(req, res) {
  // map URL to filesystem
  let filePath = path.join(__dirname, 'public', req.url.split('?')[0]);
  if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'public', 'index.html');
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // fallback to index.html for SPA
      filePath = path.join(__dirname, 'public', 'index.html');
    }
    const ext = path.extname(filePath);
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Handle POST /contact
function handleContact(req, res) {
  let body = '';
  const decoder = new StringDecoder('utf8');
  req.on('data', chunk => body += decoder.write(chunk));
  req.on('end', async () => {
    body += decoder.end();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      res.writeHead(400, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
    }
    const { name, email, message } = data;
    if (!name || !email || !message) {
      res.writeHead(400, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({ success: false, error: 'Missing fields' }));
    }
    try {
      await transporter.sendMail({
        from: `"Website Contact" <${process.env.SMTP_USER}>`,
        to:   process.env.CONTACT_EMAIL,
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      });
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error(err);
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

// Create server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/contact') {
    return handleContact(req, res);
  }
  // anything else → static
  serveStatic(req, res);
});

// Start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
