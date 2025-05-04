const path = require('path');
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

fastify.register(require('@fastify/view'), {
  engine: {
    handlebars: require('handlebars'),
  },
});

fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log('Server running...');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
