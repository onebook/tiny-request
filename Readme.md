[![NPM version][npm-img]][npm-url]
[![Build status][travis-img]][travis-url]
[![Test coverage][coveralls-img]][coveralls-url]
[![License][license-img]][license-url]
[![Dependency status][david-img]][david-url]

### tiny-request

* a tiny http.request wrapper, useful for some http sdk modules.

### usage

* options: same to http.request options, add `timeout`, `source`, `body`, `dest` support
  - timeout: type `{Number}`
  - source: type `{String} - filepath`|`{Stream}`|`{Buffer}`, will pipe to req
  - body: http body, type `{Buffer}`|`{String}`|`{Object}`
  - dest: filepath pipe from the res, `{String}`
  - rawBody: options pass to [raw-body](https://github.com/stream-utils/raw-body)

* res: type `object`
  - status
  - headers
  - body

```js
let request = require('tiny-request')

let result = await request(options)
```

```js
request({
  host: '',
  port: '',
  method: 'PUT',
  source: __filename,
  dest: __filename + '.temp'
}).then(function(res) {
  // ...
}).catch(function(err) {
  // ...
})
```

### License
MIT

[npm-img]: https://img.shields.io/npm/v/onebook.svg?style=flat-square
[npm-url]: https://npmjs.org/package/tiny-request
[travis-img]: https://img.shields.io/travis/onebook/tiny-request.svg?style=flat-square
[travis-url]: https://travis-ci.org/onebook/tiny-request
[coveralls-img]: https://img.shields.io/coveralls/onebook/tiny-request.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/onebook/tiny-request?branch=master
[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: http://opensource.org/licenses/MIT
[david-img]: https://img.shields.io/david/onebook/tiny-request.svg?style=flat-square
[david-url]: https://david-dm.org/onebook/tiny-request
