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
  await fastify.register(require('./configs/config'))
  fastify.log.info('Config loaded %o', fastify.config)

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
