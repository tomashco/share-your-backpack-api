'use strict'

const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')
const authSchemas = require('../auth/schemas/loader')

module.exports = fp(async function packAutoHooks (fastify, opts) {
  const packs = fastify.mongo.db.collection('packs')
  fastify.register(schemas)
  fastify.register(authSchemas)
  fastify.decorateRequest('packsDataSource', null)

  fastify.addHook('onRequest', async (request, reply) => {
    request.packsDataSource = {
      async countPacks (filter = {}) {
        if (request?.user?.id) { filter.userId = request.user.id }
        const totalCount = await packs.countDocuments(filter)
        return totalCount
      },
      async listPacks ({
        filter = {},
        projection = {},
        skip = 0,
        limit = 50,
        asStream = false
      } = {}) {
        if (filter.title) {
          filter.title = new RegExp(filter.title, 'i')
        } else {
          delete filter.title
        }
        if (request?.user?.id) { filter.userId = request.user.id } // if id is present, only user items are returned

        const cursor = packs
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
      async createPack ({ title }) {
        const _id = new fastify.mongo.ObjectId()
        const now = new Date()
        const userId = request.user.id
        const { insertedId } = await packs.insertOne({
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
      async createPacks (packList) {
        const now = new Date()
        const userId = request.user.id
        const toInsert = packList.map(rawPack => {
          const _id = new fastify.mongo.ObjectId()

          return {
            _id,
            userId,
            ...rawPack,
            id: _id,
            createdAt: now,
            modifiedAt: now
          }
        })

        await packs.insertMany(toInsert)
        return toInsert.map((pack) => pack._id)
      },
      async readPack (id, projection = {}) {
        const pack = await packs.findOne(
          {
            _id: new fastify.mongo.ObjectId(id)
          },
          { projection: { ...projection, _id: 0 } }
        )
        return pack
      },
      async updatePack (id, newPack) {
        return packs.updateOne(
          { _id: new fastify.mongo.ObjectId(id), userId: request.user.id },
          {
            $set: {
              ...newPack,
              modifiedAt: new Date()
            }
          }
        )
      },
      async deletePack (id) {
        return packs.deleteOne({ _id: new fastify.mongo.ObjectId(id), userId: request.user.id })
      }
    }
  })
}, {
  encapsulate: true,
  dependencies: ['@fastify/mongodb'],
  name: 'pack-store'
})
