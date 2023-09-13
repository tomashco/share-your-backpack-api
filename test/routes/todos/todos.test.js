'use strict'

const t = require('tap')
const { buildApp, isIsoDate } = require('../../helper')
const mongoose = require('mongoose')

t.test('Todos Test Suite', async (mainSuite) => {
  // * TEST SUITE CONFIGURATIONS
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://127.0.0.1:27017/todos-test-db'
  })
  const userData = {
    username: 'tomashco',
    password: 'asdfasdf'
  }
  // register a new user
  await app.inject({
    method: 'POST',
    url: '/register',
    payload: userData
  })
  // login
  const login = await app.inject({
    method: 'POST',
    url: '/authenticate',
    payload: userData
  })

  const modifiedTodoTitle = 'a modified todo'

  // add a new todo
  const newTodo = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      title: 'a new todo'
    }
  })

  // add a new todo
  const addedTodo = await app.inject({
    method: 'POST',
    url: '/todos',
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      title: 'just a new todo added'
    }
  })

  // edit the added todo
  const modifiedTodo = await app.inject({
    method: 'PUT',
    url: `/todos/${addedTodo.json().id}`,
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      title: modifiedTodoTitle
    }
  })

  // change status of added todo
  const modifiedDoneTodo = await app.inject({
    method: 'POST',
    url: `/todos/${addedTodo.json().id}/done`,
    headers: {
      authorization: `Bearer ${login.json().token}`
    }
  })

  // * TEST SUITE TESTS
  mainSuite.test('POST: /todos - Add a new todo', async t => {
    t.equal(newTodo.statusCode, 201, 'status code is correct')
    t.equal(mongoose.Types.ObjectId.isValid(newTodo.json().id), true, 'id is valid')
  })

  mainSuite.test('PUT /todos/:id - Edit a todo', async t => {
    t.equal(modifiedTodo.statusCode, 204, 'status code is correct')
  })

  mainSuite.test('POST /todos/:id/done - Set a todo as done', async t => {
    t.equal(modifiedDoneTodo.statusCode, 204, 'status code is correct')
  })

  mainSuite.test('GET /todos/:id - retrieve a todo', async t => {
    const editedTodo = await app.inject({
      method: 'GET',
      url: `/todos/${addedTodo.json().id}`
    })

    t.equal(editedTodo.statusCode, 200, 'status code is correct')
    t.equal(mongoose.Types.ObjectId.isValid(editedTodo.json().id), true, 'id is valid')
    t.equal(isIsoDate(editedTodo.json().createdAt), true, 'createdAt timestamp is valid')
    t.equal(isIsoDate(editedTodo.json().modifiedAt), true, 'modifiedAt timestamp is valid')
    t.equal(editedTodo.json().title, modifiedTodoTitle, 'title is as expected')
    t.equal(editedTodo.json().done, true, 'done status is as expected')
  })

  mainSuite.test('GET /todos - retrieve all todos', async t => {
    const allTodos = await app.inject({
      method: 'GET',
      url: '/todos'
    })

    t.equal(allTodos.statusCode, 200, 'status code is correct')
    t.equal(Array.isArray(allTodos.json().data), true, 'data is an array')
    t.equal(allTodos.json().totalCount, 2, 'total count returns the number of todos')
    t.match(allTodos.json().data[0], {
      id: /\w*/,
      title: /\w*/
    }, 'elements of data are valid Todos ')
  })

  mainSuite.test('DELETE /todos/:id - delete a todo', async t => {
    const deletedTodo = await app.inject({
      method: 'DELETE',
      url: `/todos/${addedTodo.json().id}`,
      headers: {
        authorization: `Bearer ${login.json().token}`
      }
    })

    t.equal(deletedTodo.statusCode, 204, 'status code is correct')

    const getDeletedTodo = await app.inject({
      method: 'GET',
      url: `/todos/${addedTodo.json().id}`
    })

    t.match(getDeletedTodo.json(), { error: 'Todo not found' }, 'error is as expected')
  })
})
