'use strict'

const fp = require('fastify-plugin')
const fastifySwagger = require('@fastify/swagger')
const fastifySwaggerUi = require('@fastify/swagger-ui')

const pkg = require('../package.json')

module.exports = fp(async function swaggerPlugin (fastify, opts) {
  if (fastify.secrets.NODE_ENV !== 'production') {
    fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'Fastify app',
          description: 'Fastify Book examples',
          version: pkg.version
        }
      }
    })

    fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      initOAuth: { },
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
      },
      staticCSP: true,
      transformStaticCSP: (header) => header
    })
  }
}, { dependencies: ['application-config'] })
