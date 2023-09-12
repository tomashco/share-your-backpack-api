'use strict'

const t = require('tap')
const { buildApp } = require('./helper')

t.test('Basic Test Suite', async (mainSuite) => {
  // *TEST SUITE CONFIGURATIONS
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://127.0.0.1:27017/basis-test-db'
  })

  // *TEST SUITE TESTS
  mainSuite.test('the application should start', async (t) => {
    await app.ready()
    t.pass('the application is ready')
  })

  mainSuite.test('the alive route is online', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    })
    t.same(response.json(), { root: true })
  })

  mainSuite.test('the application should not start', async mainTest => {
    mainTest.test('if there are missing ENV vars', async t => {
      try {
        await buildApp(t, {
          NODE_ENV: 'test',
          MONGO_URL: undefined
        })
        t.fail('the server must not start')
      } catch (error) {
        t.ok(error, 'error must be set')
        t.match(error.message, "required property 'MONGO_URL'")
      }
    })

    mainTest.test('when mongodb is unreachable', async t => {
      try {
        await buildApp(t, {
          NODE_ENV: 'test',
          MONGO_URL: 'mongodb://localhost:27099/test'
        })
        t.fail('the server must not start')
      } catch (error) {
        t.ok(error, 'error must be set')
        t.match(error.message, 'connect ECONNREFUSED')
      }
    })
  })
})
