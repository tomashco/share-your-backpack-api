'use strict'

const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')
const authSchemas = require('../auth/schemas/loader')

module.exports = fp(async function todoAutoHooks (fastify, opts) {
  const todos = fastify.mongo.db.collection('todos')
  fastify.register(schemas)
  fastify.register(authSchemas)
  fastify.decorateRequest('todosDataSource', null) // [1]

  fastify.addHook('onRequest', async (request, reply) => { // [2]
    request.todosDataSource = {
      async countTodos (filter = {}) {
        if (request?.user?.id) { filter.userId = request.user.id } // [4]
        const totalCount = await todos.countDocuments(filter)
        return totalCount
      },
      async listTodos ({
        filter = {},
        projection = {},
        skip = 0,
        limit = 50,
        asStream = false // [5]
      } = {}) {
        if (filter.title) {
          filter.title = new RegExp(filter.title, 'i')
        } else {
          delete filter.title
        }
        if (request?.user?.id) { filter.userId = request.user.id } // if user is authenticated it will receive only his list of todos

        const cursor = todos
          .find(filter, {
            projection: { ...projection, _id: 0 },
            limit,
            skip
          })

        if (asStream) {
          return cursor.stream()
        }
        return cursor.toArray()
      },
      async createTodo ({ title }) {
        const _id = new fastify.mongo.ObjectId()
        const now = new Date()
        const userId = request.user.id
        const { insertedId } = await todos.insertOne({
          _id,
          userId,
          title,
          done: false,
          id: _id,
          createdAt: now,
          modifiedAt: now
        })
        return insertedId
      },
      async createTodos (todoList) {
        const now = new Date()
        const userId = request.user.id
        const toInsert = todoList.map(rawTodo => {
          const _id = new fastify.mongo.ObjectId()

          return {
            _id,
            userId,
            ...rawTodo,
            id: _id,
            createdAt: now,
            modifiedAt: now
          }
        })

        await todos.insertMany(toInsert)
        return toInsert.map((todo) => todo._id)
      },
      async readTodo (id, projection = {}) {
        const todo = await todos.findOne(
          {
            _id: new fastify.mongo.ObjectId(id)
          },
          { projection: { ...projection, _id: 0 } }
        )
        return todo
      },
      async updateTodo (id, newTodo) {
        return todos.updateOne(
          { _id: new fastify.mongo.ObjectId(id), userId: request.user.id },
          {
            $set: {
              ...newTodo,
              modifiedAt: new Date()
            }
          }
        )
      },
      async deleteTodo (id) {
        return todos.deleteOne({ _id: new fastify.mongo.ObjectId(id), userId: request.user.id })
      }
    }
  })
}, {
  encapsulate: true,
  dependencies: ['@fastify/mongodb'],
  name: 'todo-store'
})
