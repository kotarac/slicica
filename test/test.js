const binaryParser = require('superagent-binary-parser')
const express = require('express')
const imageSize = require('image-size')
const r = require('supertest')
const slicica = require('../')
const test = require('tape')

const app = express()
const opts = {
  prefix: 'image',
  root: 'test',
}

app.use(slicica(opts))

function get (app, path, cb) {
  r(app).get(path).parse(binaryParser).buffer().end(cb)
}

function assert (t, w, h, type) {
  return function (err, res) {
    t.notok(err, 'no error')
    t.is(res.statusCode, 200, '200')
    const size = imageSize(res.body)
    if (w) {
      t.is(size.width, w, 'width')
    }
    if (h) {
      t.is(size.height, h, 'height')
    }
    if (type) {
      t.is(size.type, type, 'type')
    }
    t.end()
  }
}

test('invalid content type', function (t) {
  get(express().use(slicica(Object.assign({}, opts, {
    contentTypes: ['image/png'],
  }))), '/image/wat.jpg', function (err, res) {
    t.notok(err, 'no error')
    t.is(res.statusCode, 404, '404')
    t.end()
  })
})

test('plain', function (t) {
  get(app, '/image/wat.jpg', assert(t, 604, 404, 'jpg'))
})

test('height', function (t) {
  get(app, '/image/wat.jpg?h=100', assert(t, null, 100, 'jpg'))
})

test('width', function (t) {
  get(app, '/image/wat.jpg?w=100', assert(t, 100, null, 'jpg'))
})

test('width & height', function (t) {
  get(app, '/image/wat.jpg?w=100&h=100', assert(t, 100, 100, 'jpg'))
})

test('width & height & gravity', function (t) {
  get(app, '/image/wat.jpg?w=100&h=100&g=north', assert(t, 100, 100, 'jpg'))
})
