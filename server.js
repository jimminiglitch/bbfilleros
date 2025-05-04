const path = require("path")
const fastify = require("fastify")({ logger: true })

// Register plugins
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
})

fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
})

// Routes
fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html")
})

// Serve assets
fastify.get("/style.css", async (request, reply) => {
  return reply.sendFile("style.css")
})

fastify.get("/script.js", async (request, reply) => {
  return reply.sendFile("script.js")
})

fastify.get("/main.js", async (request, reply) => {
  return reply.sendFile("main.js")
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" })
    console.log(`Server running on port ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
