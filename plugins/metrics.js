'use strict'
const fp = require('fastify-plugin')
const Fastify = require('fastify')

module.exports = fp(async function (fastify) {
  if (fastify.secrets.NODE_ENV !== 'test') {
    fastify.register(require('fastify-metrics'), {
      defaultMetrics: { enabled: true },
      endpoint: null,
      name: 'metrics',
      routeMetrics: { enabled: true }
    })
    const promServer = Fastify({ logger: fastify.log })
    promServer.route({
      url: '/metrics',
      method: 'GET',
      logLevel: 'info',
      handler: (_, reply) => {
        reply.type('text/plain')
        return fastify.metrics.client.register.metrics()
      }
    })
    fastify.addHook('onClose', async (instance) => {
      await promServer.close()
    })
    await promServer.listen({ port: 9001, host: '0.0.0.0' })
  }
}, { name: 'prom' })
