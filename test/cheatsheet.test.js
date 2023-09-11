const t = require('tap')
const fs = require('fs').promises

t.test('comparing numbers', t => {
  t.plan(1)
  const myVar = '42'
  t.equal(+myVar, 42, 'this number is 42')
})

t.test('comparing exact objects', t => {
  t.plan(1)
  const sameStructure = { hello: 'world' }
  t.strictSame(sameStructure, { hello: 'world' }, 'the object is correct')
})

t.test('comparing similar objects', t => {
  t.plan(2)
  const almostLike = {
    hello: 'world',
    foo: 'bar'
  }

  t.match(almostLike, { hello: 'world' }, 'the object is similar')

  t.test('regex similar objects', subTapTest => {
    subTapTest.plan(1)
    subTapTest.match(almostLike, {
      hello: 'world',
      foo: /BAR/i
    }, 'the object is similar with regex')
  })
})

t.test('sub test', function testFunction (t) {
  t.plan(2)
  const falsyValue = null
  t.notOk(falsyValue, 'it is a falsy value')

  t.test('boolean asserions', subTapTest => {
    subTapTest.plan(1)
    subTapTest.ok(true, 'true is ok')
  })
})

t.test('async test', async t => {
  const fileContent = await fs.readFile('./package.json', 'utf8')
  t.type(fileContent, 'string', 'the file content is a string')
  await t.test('check main file', async subTest => {
    const json = JSON.parse(fileContent)
    subTest.match(json, { version: '1.0.0' })
    const appIndex = await fs.readFile(json.main, 'utf8')
    subTest.match(appIndex, 'use strict', 'the main file is correct')
  })
  t.pass('test completed')
})
