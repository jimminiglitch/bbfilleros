
// server.js
const path = require("path");
const fastify = require("fastify")({ logger: true });
const nodemailer = require("nodemailer");
const rateLimit = require("@fastify/rate-limit");
require("dotenv").config();

// ─── Static Assets ─────────────────────────────────────────────────────────────
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
fastify.register(require("@fastify/formbody"));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
fastify.register(rateLimit, {
  max: 3,                // 3 requests
  timeWindow: "1 minute" // per minute per IP
});

// ─── Mail Transport Setup ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Contact Endpoint ─────────────────────────────────────────────────────────
fastify.post("/contact", async (request, reply) => {
  const { name, email, message, nickname } = request.body;

  // 1. Honeypot check
  if (nickname) {
    request.log.warn("Spam detected: honeypot triggered");
    return reply.code(200).send(); // Silently succeed
  }

  // 2. Basic validation
  if (!name || !email || !message) {
    return reply.code(400).send({ error: "Missing fields" });
  }

  // 3. Sanitize inputs (basic strip)
  const sanitizedName = name.trim();
  const sanitizedEmail = email.trim();
  const sanitizedMessage = message.trim();

  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `New message from ${sanitizedName}`,
      text: `Name: ${sanitizedName}\nEmail: ${sanitizedEmail}\n\n${sanitizedMessage}`,
    });
    return reply.code(200).send({ success: true });
  } catch (err) {
    request.log.error(err, "Error sending email");
    return reply.code(500).send({ error: "Mail send failed" });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
    console.log("Server listening...");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
