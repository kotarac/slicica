# slicica
_diminutive for **image** in croatian_

Streaming image serving/resizing Connect middleware using Sharp/VIPS.

Intended for usage behind a proxy cache (e.g. nginx, varnish) or a CDN (e.g. CloudFlare) as it doesn't cache results on its own.

It's possible to use a custom [fs](https://nodejs.org/docs/latest/api/fs.html) implementation with at least [stat](https://nodejs.org/docs/latest/api/fs.html#fs_fs_stat_path_callback) and [createReadStream](https://nodejs.org/docs/latest/api/fs.html#fs_fs_createreadstream_path_options) implemented.
Can be useful for serving images from S3 instead of the local file system with [S3FS](https://github.com/RiptideElements/s3fs).


## Install

```sh
npm i -S slicica
```

In order for Slicica and Sharp to work, you need to have VIPS installed. [More info...](http://sharp.dimens.io/en/stable/install/)

On OSX with Homebrew
```
brew install homebrew/science/vips --with-webp --with-graphicsmagick
```


## Usage

```js
app.use(require('slicica')(options));
```

```js
var app = express();
var slicica = require('slicica');

app.use(slicica(
	// default options below
	{
		prefix: '/', // url prefix on which to serve the images
		fs: require('fs'), // fs interface for getting the images
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
));
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
