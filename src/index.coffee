etag = require 'etag'
fresh = require 'fresh'
fs = require 'fs'
mime = require 'mime'
ms = require 'ms'
resolve = require('path').resolve
sharp = require 'sharp'

sharp.cache(0, 0)
sharp.concurrency(1)

imageTypes = [
	'image/gif'
	'image/jpeg'
	'image/png'
	'image/webp'
]


module.exports = (root, prefix, opts) ->
	throw new TypeError('root path required') unless root and typeof root is 'string'
	throw new TypeError('prefix required') unless prefix and typeof prefix is 'string'

	prefix = "/#{prefix}" unless prefix[0] is '/'
	opts or= {}
	opts.maxAge ?= 0
	opts.maxAge = ms(opts.maxAge) / 1000 if typeof opts.maxAge is 'string'
	opts.compression ?= 9
	opts.progressive ?= true
	opts.etag ?= true
	opts.lastModified ?= true
	opts.contentTypes ?= [
		'image/gif'
		'image/jpeg'
		'image/png'
		'image/svg+xml'
		'image/webp'
	]

	(req, res, next) ->
		return next() unless req.path[0 .. prefix.length - 1] is prefix

		{w, h, g} = req.query
		w = parseInt(w, 10) if w
		h = parseInt(h, 10) if h
		path = resolve("#{root}#{req.path[prefix.length ..]}")
		type = mime.lookup(path)

		return next() unless type in opts.contentTypes

		fs.stat path, (err, stats) ->
			return next() if err

			res.setHeader('Content-Type', type)
			res.setHeader('Cache-Control', "public, max-age=#{opts.maxAge}") unless opts.maxAge is false
			res.setHeader('Last-Modified', stats.mtime.toUTCString()) if opts.lastModified
			res.setHeader('ETag', etag(stats)) if opts.etag

			if fresh req, res
				res.statusCode = 304
				res.end()

			f = fs.createReadStream(path).on 'error', ->
				res.statusCode = 500
				res.end()

			return f.pipe(res) unless type in imageTypes

			t = sharp().on 'error', ->
				res.statusCode = 500
				res.end()
			t.resize(w, h) if w or h
			t.crop(sharp.gravity[g]) if g of sharp.gravity
			t.progressive() if opts.progressive
			t.compressionLevel(opts.compression)

			return f.pipe(t).pipe(res)
