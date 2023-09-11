'use strict'

const path = require('path')
const AutoLoad = require('@fastify/autoload')

module.exports = async function (fastify, opts) {
  // Schemas
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'schemas'),
    indexPattern: /^loader.js$/i
  })
  // Config
  await fastify.register(require('./configs/config'), Object.assign({}, opts))
  fastify.log.info('Config loaded %o', fastify.config)

  if (fastify.secrets.NODE_ENV !== 'production') {
    await fastify.register(require('fastify-overview'), {
      addSource: true
    })
    await fastify.register(require('fastify-overview-ui'), {
    }) // ui available at {your app's url}/fastify-overview-ui/
  }

  // Plugins
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    ignorePattern: /.*.no-load\.js/,
    indexPattern: /^no$/i,
    options: fastify.config
  })

  // Routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    indexPattern: /.*routes(\.js|\.cjs)$/i,
    ignorePattern: /.*\.js/,
    autoHooksPattern: /.*hooks(\.js|\.cjs)$/i,
    autoHooks: true,
    cascadeHooks: true,
    options: Object.assign({}, opts)
  })
}

module.exports.options = require('./configs/server-options')
