'use strict'

const t = require('tap')
const { buildApp } = require('./helper')

t.test('Login Test Suite', async (mainSuite) => {
  // * TEST SUITE CONFIGURATIONS
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://127.0.0.1:27017/login-test-db'
  })
  const userData = {
    username: 'test',
    password: 'icanpass'
  }
  const privateGETRoutes = ['/me', '/todos/userTodos']
  const privatePOSTRoutes = ['/logout', '/refresh', '/todos', '/todos/:id/:status']
  const privatePUTRoutes = ['/todos/:id']
  const privateDELETERoutes = ['/todos/:id']

  function cleanCache () {
    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key]
    })
  }

  // * TEST SUITE TESTS
  mainSuite.test('cannot access protected routes', async (mainTest) => {
    mainTest.test('GET: missing ENV vars', async t => {
      for (const url of privateGETRoutes) {
        const response = await app.inject({ method: 'GET', url })
        t.equal(response.statusCode, 401)
        t.match(response.json(), {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No Authorization was found in request.headers'
        })
      }
    })
    mainTest.test('POST: missing ENV vars', async t => {
      for (const url of privatePOSTRoutes) {
        const response = await app.inject({ method: 'POST', url })
        t.equal(response.statusCode, 401)
        t.match(response.json(), {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No Authorization was found in request.headers'
        })
      }
    })
    mainTest.test('PUT: missing ENV vars', async t => {
      for (const url of privatePUTRoutes) {
        const response = await app.inject({ method: 'PUT', url })
        t.equal(response.statusCode, 401)
        t.match(response.json(), {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No Authorization was found in request.headers'
        })
      }
    })
    mainTest.test('DELETE: missing ENV vars', async t => {
      for (const url of privateDELETERoutes) {
        const response = await app.inject({ method: 'DELETE', url })
        t.equal(response.statusCode, 401)
        t.match(response.json(), {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No Authorization was found in request.headers'
        })
      }
    })
  })

  mainSuite.test('register the user', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: userData
    })
    t.equal(response.statusCode, 201)
    t.same(response.json(), { registered: true })
  })

  mainSuite.test('authenticated routes', async (mainTest) => {
    const login = await app.inject({
      method: 'POST',
      url: '/authenticate',
      payload: userData
    })
    mainTest.test('login succesfully', async t => {
      t.equal(login.statusCode, 200)
      t.match(login.json(), { token: /(\w*\.){2}.*/ })
    })

    mainTest.test('access authenticated route', async t => {
      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          authorization: `Bearer ${login.json().token}`
        }
      })
      t.equal(response.statusCode, 200)
      t.match(response.json(), { username: 'test' })
    })
  })

  mainSuite.test('register error', async (t) => {
    const path = '../routes/data-store.js'
    cleanCache()
    require(path)
    require.cache[require.resolve(path)].exports = {
      async store () {
        throw new Error('Fail to store')
      }
    }
    t.teardown(cleanCache)
    const response = await app.inject({ url: '/register' })
    t.equal(response.statusCode, 404)
  })
})
