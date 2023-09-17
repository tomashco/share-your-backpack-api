'use strict'

module.exports = async function packRoutes (fastify, _opts) {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      queryString: fastify.getSchema('schema:pack:list:query'),
      response: {
        200: fastify.getSchema('schema:pack:list:response')
      }
    },
    handler: async function listAllPacks (request, reply) {
      const { skip, limit, name } = request.query

      const packs = await request.packsDataSource.listPacks({ filter: { name }, skip, limit })
      const totalCount = await request.packsDataSource.countPacks({ filter: { name } })
      return { data: packs, totalCount }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/userPacks',
    schema: {
      queryString: fastify.getSchema('schema:pack:list:query'),
      headers: fastify.getSchema('schema:auth:token-header'),
      response: {
        200: fastify.getSchema('schema:pack:list:response')
      }
    },
    onRequest: fastify.authenticate,
    handler: async function listUserPacks (request, reply) {
      const { skip, limit, _title } = request.query

      const packs = await request.packsDataSource.listPacks({ filter: { _title }, skip, limit })
      const totalCount = await request.packsDataSource.countPacks()
      return { data: packs, totalCount }
    }
  })

  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: fastify.authenticate,
    schema: {
      body: fastify.getSchema('schema:pack:create:body'),
      headers: fastify.getSchema('schema:auth:token-header'),
      response: {
        201: fastify.getSchema('schema:pack:create:response')
      }
    },
    handler: async function createPack (request, reply) {
      const insertedId = await request.packsDataSource.createPack(request.body)
      reply.code(201)
      return { id: insertedId }
    }
  })

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: fastify.getSchema('schema:pack:read:params'),
      response: {
        200: fastify.getSchema('schema:pack')
      }
    },
    handler: async function readPack (request, reply) {
      const pack = await request.packsDataSource.readPack(request.params.id)
      if (!pack) {
        reply.code(404)
        return { error: 'Pack not found' }
      }
      return pack
    }
  })

  fastify.route({
    method: 'PUT',
    url: '/:id',
    onRequest: fastify.authenticate,
    schema: {
      params: fastify.getSchema('schema:pack:read:params'),
      headers: fastify.getSchema('schema:auth:token-header'),
      body: fastify.getSchema('schema:pack:update:body')
    },
    handler: async function updatePack (request, reply) {
      const res = await request.packsDataSource.updatePack(request.params.id, request.body)
      if (res.modifiedCount === 0) {
        reply.code(404)
        return { error: 'Pack not found' }
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
      params: fastify.getSchema('schema:pack:read:params')
    },
    handler: async function deletePack (request, reply) {
      const res = await request.packsDataSource.deletePack(request.params.id)
      if (res.deletedCount === 0) {
        reply.code(404)
        return { error: 'Pack not found' }
      }
      reply.code(204)
    }
  })
}
