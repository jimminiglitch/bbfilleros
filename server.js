// server.js
const path = require('path');
const fastify = require('fastify')({ logger: true });

// Serve everything in /public as static assets
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});

// For now we just serve index.html at “/”
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Start it up
const start = async () => {
  try {
    await fastify.listen({
      host: '0.0.0.0',
      port: process.env.PORT || 3000
    });
    console.log('Server running…');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
