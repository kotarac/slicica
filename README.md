# slicica
*diminutive for **image** in croatian*

Image serving/resizing Connect middleware using Sharp/VIPS.

Intended for usage behind a CDN like Cloudflare as it doesn't cache results.


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
app.use(require('slicica')(root, prefix, options));
```

```js
var app = express();
var slicica = require('slicica');

app.use(slicica(
	'static/images', // folder containing images to serve from
	'/images', // url prefix
	// default options below
	{
		maxAge: 0, // takes seconds as integer | ms compatible string | false to disable
		etag: true, // generate and send ETag header
		lastModified: true, // send the Last-Modified header
		compression: 9, // image compression level (0-9)
		progressive: true, // progressive scan for JPG and PNG
		contentTypes: [
			'image/gif'
			'image/jpeg'
			'image/png'
			'image/svg+xml'
			'image/webp'
		] // content types to serve (text types like svg+xml are just piped through), other requests are ignored
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
