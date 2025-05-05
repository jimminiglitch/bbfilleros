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

// ─── STARFIELD BACKGROUND ────────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("background-canvas");
  const ctx    = canvas.getContext("2d");
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const numStars = 300;
  const stars = Array.from({ length: numStars }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: Math.random()
  }));

  (function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
      star.z -= 2;
      if (star.z <= 0) {
        star.z = canvas.width;
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      }
      const k = 128.0 / star.z;
      const px = (star.x - canvas.width/2) * k + canvas.width/2;
      const py = (star.y - canvas.height/2) * k + canvas.height/2;
      const size = Math.max(0, (1 - star.z / canvas.width) * 3);
      ctx.globalAlpha = star.o;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  })();
}

// make sure it actually runs after your main script loads:
window.addEventListener("load", initStarfield);
