// server.js
const path = require("path");
const fastify = require("fastify")({ logger: true });
const fastifyStatic = require("@fastify/static");

// Serve static files from /public
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// Route to serve index.html
fastify.get("/", (request, reply) => {
  reply.sendFile("index.html");
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
