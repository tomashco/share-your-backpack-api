'use strict'

const t = require('tap')
const { buildApp } = require('./helper')

t.test('the application should start', async (t) => {
  const app = await buildApp(t)
  await app.ready()
  t.pass('the application is ready')
})

t.test('the alive route is online', async (t) => {
  const app = await buildApp(t)
  const response = await app.inject({
    method: 'GET',
    url: '/'
  })
  t.same(response.json(), { root: true })
})

t.todo('the application should not start', async (t) => { })
