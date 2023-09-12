'use strict'
const fcli = require('fastify-cli/helper')

const startArgs = '-l silent --options app.js'

const defaultEnv = {
  NODE_ENV: 'test',
  MONGO_URL: 'mongodb://localhost:27017/basis-test',
  JWT_SECRET: 'secret-1234567890',
  PORT: 3000,
  JWT_EXPIRE_IN: 3600
}

async function buildApp (t, env, serverOptions) {
  const app = await fcli.build(startArgs, { configData: { ...defaultEnv, ...env } },
    serverOptions
  )
  t.teardown(() => { app.close() })
  return app
}

module.exports = {
  buildApp
}
