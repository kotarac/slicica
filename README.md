# slicica [![npm version](https://badge.fury.io/js/slicica.svg)](https://www.npmjs.com/package/slicica)

_diminutive for **image** in croatian_

Image serving/resizing/optimizing Express/Connect middleware using [sharp](https://github.com/lovell/sharp)/[libvips](https://github.com/jcupitt/libvips).

Intended for usage behind a proxy cache (e.g. nginx, varnish) or a CDN (e.g. CloudFlare) as it doesn't cache results on its own.

## Install

```sh
npm add slicica
```

Installing this module will automatically fetch and build libvips and its dependencies on Linux, MacOS and Windows x64.

For more information read [sharp's documentation](https://sharp.pixelplumbing.com/).

## Usage

```js
app.use(require('slicica')(options))
```

```js
const app = express()
const slicica = require('slicica')

app.use(
  slicica(
    // default options below
    {
      prefix: '/', // url prefix on which to serve the images
      root: '', // root folder / prefix to prepend to the requested image (path where the images reside)
      maxAge: 0, // takes seconds as integer || ms compatible string || false to disable
      progressive: false, // progressive scan for JPG and PNG
      quality: 80, // output quality for jpeg, webp, png, tiff
      compression: 6, // image compression level (0-9)
      etag: true, // generate and send the ETag header
      lastModified: true, // send the Last-Modified header
      cache: false, // options passed to sharp.cache
      concurrency: 0, // number of threads sharp will use (0 resets it to default = number of cores)
      contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'], // content types to serve, other requests are ignored
    },
  ),
)
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
