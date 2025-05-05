// server.js
const path       = require('path');
const fastify    = require('fastify')({ logger: true });
const nodemailer = require('nodemailer');

// ─── 1. Static assets ───────────────────────────────────────────────────────
fastify.register(require('@fastify/static'), {
  root:  path.join(__dirname, 'public'),
  prefix: '/'    // serve everything in public/ at the root URL
});

// ─── 2. Body parsing ────────────────────────────────────────────────────────
// Fastify parses JSON by default; formbody plugin is only needed for urlencoded
fastify.register(require('@fastify/formbody'));

// ─── 3. Mail transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',  // use SSL on port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ─── 4. Contact API route ──────────────────────────────────────────────────
fastify.post('/contact', async (request, reply) => {
  // Log for debugging
  fastify.log.info({ body: request.body }, 'POST /contact payload');

  const { name, email, message } = request.body;
  try {
    await transporter.sendMail({
      from:    `"Website Contact" <${process.env.SMTP_USER}>`,
      to:      process.env.CONTACT_EMAIL,
      subject: `New message from ${name}`,
      text:    `Name: ${name}\nEmail: ${email}\n\n${message}`
    });
    return reply.code(200).send({ success: true });
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ success: false, error: err.message });
  }
});

// ─── 5. Serve index.html ──────────────────────────────────────────────────
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// ─── 6. Start server ───────────────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.listen({
      host: '0.0.0.0',
      port: process.env.PORT || 3000
    });
    fastify.log.info('Server running');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
