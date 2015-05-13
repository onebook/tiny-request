'use strict'

let assert = require('assert')
let parse = require('co-body')
let equal = assert.deepEqual
let request = require('..')
let path = require('path')
let koa = require('koa')
let fs = require('fs')
let join = path.join
let app = koa()

app.use(function* (next) {
  yield * next

  if (this.path === '/json') {
    this.body = yield parse(this)
    return
  }

  if (this.path === '/string') {
    this.body = yield parse(this)
    this.body = JSON.stringify(this.body)
    return
  }

  if (this.path.startsWith('/dest')) {
    this.body = fs.createReadStream(__filename)
    return
  }

  if (this.path === '/timeout') {
    yield delay(10000)
    return
  }

  if (this.path.startsWith('/upload')) {
    let filepath = join(__dirname, this.path + '.temp')

    yield save(this, filepath)

    this.body = {
      filepath: filepath
    }
    return
  }
})

app.listen(3000)

before(function() {
  let uploadDir = join(__dirname, 'upload')

  try {
    fs.mkdirSync(uploadDir)
  } catch (e) {}
})

describe('## tiny-request', function() {
  describe('# options.source', function() {
    it('stream', function() {
      return request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/stream',
        source: fs.createReadStream(__filename)
      }).then(function(res) {
        assertFileEqual(__filename, 'upload/stream.temp')
        equal(res.status, 200)
      })
    })

    it('buffer', function() {
      return request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/buffer',
        source: new Buffer('test')
      }).then(function(res) {
        equal(fs.readFileSync(path.resolve(__dirname, 'upload/buffer.temp'), 'utf8'), 'test')
        equal(res.status, 200)
      })
    })

    it('filepath', function() {
      return request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/file',
        source: __filename
      }).then(function(res) {
        assertFileEqual(__filename, 'upload/file.temp')
        equal(res.status, 200)
      })
    })

    it('invalid filepath', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/file',
        source: path.join(__dirname, 'xxoo.js')
      }).then(function(res) {
        console.log(res)
        done()
      }).catch(function(err) {
        equal(err.code, 'ENOENT')
        done()
      })
    })
  })

  describe('# options.dest', function() {
    it('filepath', function() {
      let filepath = join(__dirname, 'upload/filepath-dest.js')

      return request({
        host: 'localhost',
        port: 3000,
        method: 'GET',
        path: '/dest/stream',
        dest: filepath
      }).then(function(res) {
        assertFileEqual(__filename, filepath)
        equal(res.status, 200)
      })
    })
  })

  describe('# options.body', function() {
    it('json', function() {
      let json = {
        name: 'test'
      }

      return request({
        host: 'localhost',
        port: 3000,
        body: json,
        method: 'POST',
        path: '/json',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function(res) {
        equal(JSON.parse(res.body), json)
      })
    })

    it('string', function() {
      let json = {
        name: 'test'
      }

      return request({
        host: 'localhost',
        port: 3000,
        body: json,
        method: 'POST',
        path: '/string',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function(res) {
        equal(res.body.toString(), JSON.stringify(json))
      })
    })
  })

  describe('# timeout', function() {
    it('408', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        timeout: 100,
        path: '/timeout'
      }).catch(function(err) {
        equal(err.status, 408)
        equal(err.message, 'Request Timeout')
        done()
      })
    })
  })
})

function assertFileEqual(path1, path2) {
  path1 = path.resolve(__dirname, path1)
  path2 = path.resolve(__dirname, path2)

  let file1 = fs.readFileSync(path1, 'utf8')
  let file2 = fs.readFileSync(path2, 'utf8')

  equal(file1, file2)
}

function save(ctx, filepath) {
  return new Promise(function(resolve, reject) {
    let dest = fs.createWriteStream(filepath)

    ctx.req.pipe(dest)

    dest.on('finish', function() {
      resolve()
    }).on('error', function(error) {
      reject(error)
    })
  })
}

function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve()
    }, ms)
  })
}
