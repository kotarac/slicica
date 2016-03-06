etag = require 'etag'
fresh = require 'fresh'
fs = require 'fs'
mime = require 'mime'
ms = require 'ms'
sharp = require 'sharp'


imageTypes = [
	'image/gif'
	'image/jpeg'
	'image/png'
	'image/webp'
]


module.exports = (opts = {}) ->
	opts.prefix ?= '/'
	opts.prefix = "/#{opts.prefix}" unless opts.prefix[0] is '/'
	opts.fs or= fs
	opts.root or= ''
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
	opts.cacheMemory ?= 0
	opts.cacheItems ?= 0
	opts.concurrency ?= 0

	sharp.cache opts.cacheMemory, opts.cacheItems
	sharp.concurrency opts.concurrency

	(req, res, next) ->
		return next() unless req.method.toUpperCase() is 'GET'
		return next() unless req.path[0 .. opts.prefix.length - 1] is opts.prefix

		{w, h, g} = req.query
		w = parseInt(w, 10) if w
		h = parseInt(h, 10) if h
		path = decodeURI("#{opts.root}#{req.path[opts.prefix.length ..]}")
		type = mime.lookup(path)

		return next() unless type in opts.contentTypes

		req.route =
			path: "#{opts.prefix}/:slicica"
			methods: get: true

		opts.fs.stat path, (err, stats) ->
			return next() if err

			res.setHeader('Content-Type', type)
			res.setHeader('Cache-Control', "public, max-age=#{opts.maxAge}") unless opts.maxAge is false
			res.setHeader('Last-Modified', stats.mtime.toUTCString()) if opts.lastModified
			res.setHeader('ETag', etag(stats)) if opts.etag

			if fresh req, res
				res.statusCode = 304
				res.end()

			f = opts.fs.createReadStream(path).on 'error', ->
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
