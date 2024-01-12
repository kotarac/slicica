const etag = require('etag')
const fs = require('fs')
const fresh = require('fresh')
const mime = require('mime')
const ms = require('ms')
const sharp = require('sharp')

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']

function setHeaders(res, headers) {
  for (const k of Object.keys(headers)) {
    res.setHeader(k, headers[k])
  }
}

module.exports = function slicica(opts) {
  opts = {
    prefix: '/',
    root: '',
    maxAge: 0,
    progressive: false,
    quality: 80,
    compression: 6,
    etag: true,
    lastModified: true,
    cache: false,
    concurrency: 0,
    contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
    ...opts,
  }
  if (opts.prefix[0] !== '/') {
    opts.prefix = `/${opts.prefix}`
  }
  if (typeof opts.magxAge === 'string') {
    opts.maxAge = ms(opts.maxAge) / 1000
  }

  sharp.cache(opts.cache)
  sharp.concurrency(opts.concurrency)

  return function (req, res, next) {
    const method = req.method.toUpperCase()

    if (!['GET', 'HEAD'].includes(method)) {
      next()
      return
    }
    if (!req.path.startsWith(opts.prefix)) {
      next()
      return
    }

    const { g, max } = req.query
    const w = parseInt(req.query.w, 10) || null
    const h = parseInt(req.query.h, 10) || null
    const path = decodeURI(`${opts.root}${req.path.slice(opts.prefix.length)}`)
    const type = mime.getType(path)
    if (!opts.contentTypes.includes(type)) {
      next()
      return
    }

    req.route = {
      path: `${opts.prefix}/:slicica`,
      methods: {
        [`${method.toLowerCase()}`]: true,
      },
    }

    fs.stat(path, function (err, stats) {
      if (err) {
        next()
        return
      }

      const reqHeaders = req.headers
      const resHeaders = {}
      resHeaders['content-type'] = type
      if (opts.maxAge !== false) {
        resHeaders['cache-control'] = `public, max-age=${opts.maxAge}`
      }
      if (opts.lastModified) {
        resHeaders['last-modified'] = stats.mtime.toUTCString()
      }
      if (opts.etag) {
        resHeaders['etag'] = etag(`${etag(stats)}p${path}w${w}h${h}g${g}max${max}`)
      }

      if (!imageTypes.includes(type)) {
        next()
        return
      }
      if (fresh(reqHeaders, resHeaders)) {
        setHeaders(res, resHeaders)
        res.statusCode = 304
        res.end()
        return
      }
      if (method === 'HEAD') {
        setHeaders(res, resHeaders)
        res.statusCode = 200
        res.end()
        return
      }

      const s = sharp(path)
      const gravity = sharp.gravity[g] != null ? sharp.gravity[g] : 'center'
      if (w || h || max) {
        const opts = {}
        if (gravity) {
          opts.position = gravity
        }
        if (max) {
          opts.withoutEnlargement = true
        }
        s.resize(w, h, opts)
      }
      s.jpeg({
        force: false,
        quality: opts.quality,
        progressive: opts.progressive,
        compressionLevel: opts.compression,
      })
      s.png({
        force: false,
        quality: opts.quality,
        progressive: opts.progressive,
        compressionLevel: opts.compression,
      })
      s.webp({
        force: false,
        quality: opts.quality,
      })
      s.tiff({
        force: false,
        quality: opts.quality,
      })

      setHeaders(res, resHeaders)
      s.toBuffer(function (err, buf, info) {
        if (err) {
          res.statusCode = 500
          res.end()
          return
        }
        res.statusCode = 200
        res.write(buf)
        res.end()
      })
    })
  }
}
