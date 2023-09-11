'use strict'

// This file contains code that we reuse
// between our tests.
const fcli = require('fastify-cli/helper')

const startArgs = '-l silent --options app.js'

const defaultEnv = {
  NODE_ENV: 'test',
  MONGO_URL: 'mongodb://localhost:27017/basic-test',
  JWT_SECRET: 'secret-1234567890',
  PORT: 3000,
  JWT_EXPIRE_IN: 3600
}

// automatically build and tear down our instance
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
