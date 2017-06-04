# slicica [![Build Status](https://travis-ci.org/kotarac/slicica.svg?branch=master)](https://travis-ci.org/kotarac/slicica) [![npm version](https://badge.fury.io/js/slicica.svg)](https://www.npmjs.com/package/slicica) [![Dependency Status](https://david-dm.org/kotarac/slicica/status.svg)](https://david-dm.org/kotarac/slicica)
_diminutive for **image** in croatian_

Streaming image serving/resizing Connect middleware using [sharp](https://github.com/lovell/sharp) / [libvips](https://github.com/jcupitt/libvips).

Intended for usage behind a proxy cache (e.g. nginx, varnish) or a CDN (e.g. CloudFlare) as it doesn't cache results on its own.


## Install

```sh
npm i -S slicica
```

Installing this module will automatically fetch and build libvips and its dependencies on Linux, MacOS and Windows x64.

For more information read [sharp's documentation](http://sharp.dimens.io/en/stable/install/).


## Usage

```js
app.use(require('slicica')(options))
```

```js
const app = express()
const slicica = require('slicica')

app.use(slicica(
  // default options below
  {
    prefix: '/', // url prefix on which to serve the images
    root: '', // root folder / prefix to prepend to the requested image (path where the images reside)
    maxAge: 0, // takes seconds as integer | ms compatible string | false to disable
    etag: true, // generate and send ETag header
    lastModified: true, // send the Last-Modified header
    progressive: false, // progressive scan for JPG and PNG
    quality: 80, // output quality for jpeg, webp and tiff
    compression: 6, // image compression level (0-9)
    contentTypes: [
      'image/gif'
      'image/jpeg'
      'image/png'
      'image/svg+xml'
      'image/webp'
    ], // content types to serve (text types like svg+xml are just piped through), other requests are ignored
    cache: false, // options passed to sharp.cache
    concurrency: 0 // number of threads sharp will use (0 = number of cores)
  }
))
```


## Request example

```
http://localhost:####/images/random.jpg?w=800
```
```
http://localhost:####/images/random.jpg?h=600
```
```
http://localhost:####/images/random.jpg?w=300&h=200&g=north
```

```js
w // width
h // height
g = 'center' // gravity (north|northeast|east|southeast|south|southwest|west|northwest|center|centre)
if (w && h) {
  // crops to exact dimensions using the default or specified gravity
} else if (w || h) {
  // resizes preserving the aspect ratio
} else {
  // just pipes the original image as response
}
```


## License

MIT © Stipe Kotarac (https://github.com/kotarac)
