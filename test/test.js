const assert = require('node:assert/strict')
const binaryParser = require('superagent-binary-parser')
const express = require('express')
const r = require('supertest')
const test = require('node:test')
const { imageSize } = require('image-size')

const slicica = require('../')

const app = express()
const options = {
  prefix: 'image',
  root: 'test',
}

app.use(slicica(options))

async function get(app, path) {
  return r(app).get(path).parse(binaryParser).buffer()
}

function check(res, w, h, type) {
  assert.equal(res.statusCode, 200, '200')
  const size = imageSize(res.body)
  if (w) {
    assert.equal(size.width, w, 'width')
  }

  if (h) {
    assert.equal(size.height, h, 'height')
  }

  if (type) {
    assert.equal(size.type, type, 'type')
  }
}

test('invalid content type', async () => {
  const res = await get(
    express().use(
      slicica({
        ...options,
        contentTypes: ['image/png'],
      }),
    ),
    '/image/wat.jpg',
  )
  assert.equal(res.statusCode, 404, '404')
})

test('jpg plain', async () => {
  check(await get(app, '/image/wat.jpg'), 604, 404, 'jpg')
})

test('jpg height', async () => {
  check(await get(app, '/image/wat.jpg?h=100'), null, 100, 'jpg')
})

test('jpg width', async () => {
  check(await get(app, '/image/wat.jpg?w=100'), 100, null, 'jpg')
})

test('jpg width & height', async () => {
  check(await get(app, '/image/wat.jpg?w=100&h=100'), 100, 100, 'jpg')
})

test('jpg width & height & gravity', async () => {
  check(await get(app, '/image/wat.jpg?w=100&h=100&g=north'), 100, 100, 'jpg')
})

test('jpg width & height & max', async () => {
  check(await get(app, '/image/wat.jpg?w=1000&h=1000&max=1'), 604, 404, 'jpg')
})

test('png plain', async () => {
  check(await get(app, '/image/wat.png'), 604, 404, 'png')
})

test('png height', async () => {
  check(await get(app, '/image/wat.png?h=100'), null, 100, 'png')
})

test('png width', async () => {
  check(await get(app, '/image/wat.png?w=100'), 100, null, 'png')
})

test('png width & height', async () => {
  check(await get(app, '/image/wat.png?w=100&h=100'), 100, 100, 'png')
})

test('png width & height & gravity', async () => {
  check(await get(app, '/image/wat.png?w=100&h=100&g=north'), 100, 100, 'png')
})

test('png width & height & max', async () => {
  check(await get(app, '/image/wat.png?w=1000&h=1000&max=1'), 604, 404, 'png')
})
