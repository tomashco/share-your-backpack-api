'use strict'

module.exports = async function todoRoutes (fastify, _opts) {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      queryString: fastify.getSchema('schema:todo:list:query'),
      response: {
        200: fastify.getSchema('schema:todo:list:response')
      }
    },
    handler: async function listAllTodos (request, reply) {
      const { skip, limit, title } = request.query

      const todos = await request.todosDataSource.listTodos({ filter: { title }, skip, limit })
      const totalCount = await request.todosDataSource.countTodos()
      return { data: todos, totalCount }
    }
  })
  fastify.route({
    method: 'GET',
    url: '/userTodos',
    schema: {
      queryString: fastify.getSchema('schema:todo:list:query'),
      headers: fastify.getSchema('schema:auth:token-header'),
      response: {
        200: fastify.getSchema('schema:todo:list:response')
      }
    },
    onRequest: fastify.authenticate,
    handler: async function listUserTodos (request, reply) {
      const { skip, limit, title } = request.query

      const todos = await request.todosDataSource.listTodos({ filter: { title }, skip, limit })
      const totalCount = await request.todosDataSource.countTodos()
      return { data: todos, totalCount }
    }
  })

  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: fastify.authenticate,
    schema: {
      body: fastify.getSchema('schema:todo:create:body'),
      headers: fastify.getSchema('schema:auth:token-header'),
      response: {
        201: fastify.getSchema('schema:todo:create:response')
      }
    },
    handler: async function createTodo (request, reply) {
      const insertedId = await request.todosDataSource.createTodo(request.body)
      reply.code(201)
      return { id: insertedId }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/:id',
    // onRequest: fastify.authenticate,
    schema: {
      params: fastify.getSchema('schema:todo:read:params'),
      // headers: fastify.getSchema('schema:auth:token-header'),
      response: {
        200: fastify.getSchema('schema:todo')
      }
    },
    handler: async function readTodo (request, reply) {
      const todo = await request.todosDataSource.readTodo(request.params.id)
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
    onRequest: fastify.authenticate,
    schema: {
      params: fastify.getSchema('schema:todo:read:params'),
      headers: fastify.getSchema('schema:auth:token-header'),
      body: fastify.getSchema('schema:todo:update:body')
    },
    handler: async function updateTodo (request, reply) {
      const res = await request.todosDataSource.updateTodo(request.params.id, request.body)
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
    onRequest: fastify.authenticate,
    schema: {
      headers: fastify.getSchema('schema:auth:token-header'),
      params: fastify.getSchema('schema:todo:read:params')
    },
    handler: async function deleteTodo (request, reply) {
      const res = await request.todosDataSource.deleteTodo(request.params.id)
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
    onRequest: fastify.authenticate,
    schema: {
      headers: fastify.getSchema('schema:auth:token-header'),
      params: fastify.getSchema('schema:todo:status:params')
    },
    handler: async function changeStatus (request, reply) {
      const res = await request.todosDataSource.updateTodo(request.params.id, { done: request.params.status === 'done' })
      if (res.modifiedCount === 0) {
        reply.code(404)
        return { error: 'Todo not found' }
      }

      reply.code(204)
    }
  })
}
