'use strict'

const t = require('tap')
const { buildApp, isIsoDate } = require('../../helper')
const mongoose = require('mongoose')

t.test('Packs Test Suite', async (mainSuite) => {
  // * TEST SUITE CONFIGURATIONS
  const app = await buildApp(t, {
    MONGO_URL: 'mongodb://127.0.0.1:27017/packs-test-db'
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

  const modifiedPackDescription = 'a modified pack description'

  // add a new pack
  const newPack = await app.inject({
    method: 'POST',
    url: '/packs',
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      name: 'a new pack',
      description: '',
      duration: 3,
      location: 'val di Mello',
      activityLink: 'www.komoot.com',
      activityType: 'hiking',
      packData: [{
        name: 'sleeping pad',
        link: 'www.google.com',
        category: ['sleeping'],
        description: 'a very warm gear'
      }, {
        name: 'sleeping matress',
        link: 'www.google.com',
        category: ['sleeping'],
        description: 'to sleep on'
      }
      ],
      schemaVersion: 'v0'
    }
  })
  const packData = [{
    name: 'sleeping pad',
    link: 'www.google.com',
    category: ['sleeping'],
    description: 'a very warm gear'
  }]
  // add a new pack
  const addedPack = await app.inject({
    method: 'POST',
    url: '/packs',
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      name: 'adventure 2',
      description: 'a trip in the fields',
      duration: 3,
      location: 'val di Scalve',
      activityLink: 'www.komoot.com',
      activityType: 'cycling',
      packData,
      schemaVersion: 'v0'
    }
  })

  // edit the added pack
  const modifiedPack = await app.inject({
    method: 'PUT',
    url: `/packs/${addedPack.json().id}`,
    headers: {
      authorization: `Bearer ${login.json().token}`
    },
    body: {
      description: modifiedPackDescription
    }
  })

  // change status of added pack
  // const modifiedDonePack = await app.inject({
  //   method: 'POST',
  //   url: `/packs/${addedPack.json().id}/done`,
  //   headers: {
  //     authorization: `Bearer ${login.json().token}`
  //   }
  // })

  // * TEST SUITE TESTS
  mainSuite.test('POST: /packs - Add a new pack', async t => {
    t.equal(newPack.statusCode, 201, 'status code is correct')
    t.equal(mongoose.Types.ObjectId.isValid(newPack.json().id), true, 'id is valid')
  })

  mainSuite.test('PUT /packs/:id - Edit a pack', async t => {
    t.equal(modifiedPack.statusCode, 204, 'status code is correct')
  })

  // mainSuite.test('POST /packs/:id/done - Set a pack as done', async t => {
  //   t.equal(modifiedDonePack.statusCode, 204, 'status code is correct')
  // })

  mainSuite.test('GET /packs/:id - retrieve a pack', async t => {
    const editedPack = await app.inject({
      method: 'GET',
      url: `/packs/${addedPack.json().id}`
    })

    t.equal(editedPack.statusCode, 200, 'status code is correct')
    t.equal(mongoose.Types.ObjectId.isValid(editedPack.json().id), true, 'id is valid')
    t.equal(isIsoDate(editedPack.json().createdAt), true, 'createdAt timestamp is valid')
    t.equal(isIsoDate(editedPack.json().modifiedAt), true, 'modifiedAt timestamp is valid')
    t.equal(editedPack.json().description, modifiedPackDescription, 'description is as expected')
    t.equal(editedPack.json().packData.length, packData.length, 'packData array is as expected')
  })

  mainSuite.test('GET /packs - retrieve all packs', async t => {
    const allPacks = await app.inject({
      method: 'GET',
      url: '/packs'
    })

    t.equal(allPacks.statusCode, 200, 'status code is correct')
    t.equal(Array.isArray(allPacks.json().data), true, 'data is an array')
    t.equal(allPacks.json().totalCount, 2, 'total count returns the number of packs')
    t.match(allPacks.json().data[0], {
      id: /\w*/,
      name: /\w*/
    }, 'elements of data are valid Packs ')
  })

  mainSuite.test('DELETE /packs/:id - delete a pack', async t => {
    const deletedPack = await app.inject({
      method: 'DELETE',
      url: `/packs/${addedPack.json().id}`,
      headers: {
        authorization: `Bearer ${login.json().token}`
      }
    })

    t.equal(deletedPack.statusCode, 204, 'status code is correct')

    const getDeletedPack = await app.inject({
      method: 'GET',
      url: `/packs/${addedPack.json().id}`
    })

    t.match(getDeletedPack.json(), { error: 'Pack not found' }, 'error is as expected')
  })
})
