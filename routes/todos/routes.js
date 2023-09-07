'use strict'

module.exports = async function todoRoutes (fastify, _opts) {
  const todos = fastify.mongo.db.collection('todos')

  fastify.route({
    method: 'GET',
    url: '/',
    handler: async function listTodo (request, reply) {
      const { skip, limit, title } = request.query
      const filter = title
        ? {
            title: new RegExp(title,
              'i')
          }
        : {}

      const data = await todos
        .find(filter, {
          limit,
          skip
        })
        .toArray()

      const totalCount = await todos.countDocuments(filter)

      return { data, totalCount }
    }
  })
  fastify.route({
    method: 'POST',
    url: '/',
    handler: async function createTodo (request, reply) {
      const _id = new this.mongo.ObjectId()
      const now = new Date()
      const createdAt = now
      const modifiedAt = now
      const newTodo = {
        _id,
        id: _id,
        ...request.body,
        done: false,
        createdAt,
        modifiedAt
      }
      await todos.insertOne(newTodo)
      reply.code(201)
      return { id: _id }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/:id',
    handler: async function readTodo (request, reply) {
      const todo = await todos.findOne(
        { _id: new this.mongo.ObjectId(request.params.id) },
        { projection: { _id: 0 } }
      )
      if (!todo) {
        reply.code(404)
        return { error: 'Todo not found' }
      }
      return todo
    }
  })

  fastify.route({
    method: 'PUT',
    url: '/:id',
    handler: async function updateTodo (request, reply) {
      const res = await todos.updateOne(
        {
          _id: new
          fastify.mongo.ObjectId(request.params.id)
        },
        {
          $set: {
            ...request.body,
            modifiedAt: new Date()
          }
        }
      )
      if (res.modifiedCount === 0) {
        reply.code(404)
        return { error: 'Todo not found' }
      }
      reply.code(204)
    }
  })

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    handler: async function deleteTodo (request, reply) {
      const res = await todos.deleteOne({
        _id: new
        fastify.mongo.ObjectId(request.params.id)
      })
      if (res.deletedCount === 0) {
        reply.code(404)
        return { error: 'Todo not found' }
      }
      reply.code(204)
    }
  })

  fastify.route({
    method: 'POST',
    url: '/:id/:status',
    handler: async function changeStatus (request, reply) {
      const done = request.params.status === 'done'
      const res = await todos.updateOne(
        {
          _id: new
          fastify.mongo.ObjectId(request.params.id)
        },
        {
          $set: {
            done,
            modifiedAt: new Date()
          }
        }
      )
      if (res.modifiedCount === 0) {
        reply.code(404)
        return { error: 'Todo not found' }
      }
      reply.code(204)
    }
  })
}
