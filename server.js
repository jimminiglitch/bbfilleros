const path = require('path');
const fastify = require('fastify')({ logger: true });
const nodemailer = require('nodemailer');

// 1. Static assets
fastify.register(require('@fastify/static'), { root: path.join(__dirname, 'public'), prefix: '/' });

// 2. Body parsing
fastify.register(require('@fastify/formbody'));

// 3. Mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// 4. Contact API
fastify.post('/contact', async (request, reply) => {
  const { name, email, message } = request.body;
  if(!name||!email||!message) return reply.code(400).send({ success:false, error:'Missing fields' });
  try {
    await transporter.sendMail({
      from: `"Web Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `Message from ${name}`,
      text: `Name: ${name}
Email: ${email}

${message}`
    });
    return reply.send({ success:true });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ success:false, error: err.message });
  }
});

// 5. Pages
['/', '/contact.html', '/resume.html', '/snake.html'].forEach(route => {
  fastify.get(route, async (req, reply) => reply.sendFile(route === '/' ? 'index.html' : route.substring(1)));
});

// 6. Start server
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
  .then(()=> fastify.log.info('Server running'))
  .catch(err=>{ fastify.log.error(err); process.exit(1); });