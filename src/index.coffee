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


setHeaders = (res, headers) ->
	res.setHeader k, v for own k, v of headers


module.exports = (opts = {}) ->
	opts.prefix ?= '/'
	opts.prefix = "/#{opts.prefix}" unless opts.prefix[0] is '/'
	opts.fs or= fs
	opts.root or= ''
	opts.maxAge ?= 0
	opts.maxAge = ms(opts.maxAge) / 1000 if typeof opts.maxAge is 'string'
	opts.progressive ?= false
	opts.quality ?= 80
	opts.compression ?= 6
	opts.etag ?= true
	opts.lastModified ?= true
	opts.contentTypes ?= [
		'image/gif'
		'image/jpeg'
		'image/png'
		'image/svg+xml'
		'image/webp'
	]
	opts.cache ?= false
	opts.concurrency ?= 0

	sharp.cache opts.cache
	sharp.concurrency opts.concurrency

	(req, res, next) ->
		method = req.method.toUpperCase()
		return next() unless req.method.toUpperCase() in ['GET', 'HEAD']
		return next() unless req.path[0 .. opts.prefix.length - 1] is opts.prefix

		{w, h, g} = req.query
		w = parseInt(w, 10) if w
		h = parseInt(h, 10) if h
		path = decodeURI("#{opts.root}#{req.path[opts.prefix.length ..]}")
		type = mime.lookup(path)
		return next() unless type in opts.contentTypes

		req.route =
			path: "#{opts.prefix}/:slicica"
			methods: "#{method.toLowerCase()}": true

		opts.fs.stat path, (err, stats) ->
			return next() if err

			reqHeaders = req.headers
			resHeaders = {}
			resHeaders['content-type'] = type
			resHeaders['cache-control'] = "public, max-age=#{opts.maxAge}" unless opts.maxAge is false
			resHeaders['last-modified'] = stats.mtime.toUTCString() if opts.lastModified
			resHeaders['etag'] = etag("#{etag(stats)}p#{path}w#{w}h#{h}g#{g}") if opts.etag

			if fresh reqHeaders, resHeaders
				setHeaders res, resHeaders
				res.statusCode = 304
				res.end()
				return

			if method is 'HEAD'
				setHeaders res, resHeaders
				res.statusCode = 200
				res.end()
				return

			f = opts.fs.createReadStream(path).on 'error', ->
				res.statusCode = 500
				res.end()

			if type not in imageTypes
				setHeaders res, resHeaders
				f.pipe(res)
				return

			t = sharp().on 'error', ->
				res.statusCode = 500
				res.end()
			t.resize(w, h) if w or h
			t.crop(sharp.gravity[g]) if g of sharp.gravity
			t.progressive() if opts.progressive
			t.quality(opts.quality)
			t.compressionLevel(opts.compression)

			setHeaders res, resHeaders
			f.pipe(t).pipe(res)
			return
