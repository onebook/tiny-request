'use strict'

let onFinished = require('on-finished')
let getRawBody = require('raw-body')
let destroy = require('destroy')
let Stream = require('stream')
let isBuffer = Buffer.isBuffer
let http = require('http')
let cp = require('fs-cp')
let fs = require('fs')

module.exports = request

/**
 * @param {object} - options
 */
function request(options) {
  return new Promise(function(resolve, reject) {
    var req = http.request(options, function(res) {
      let result = {
        status: res.statusCode,
        headers: res.headers
      }

      let rawBodyOpts = options.rawBody || {}

      if (options.dest) {
        return cp(res, options.dest).then(function() {
          resolve(result)
        }).catch(reject)
      }

      getRawBody(res, rawBodyOpts).then(function(buffer) {
        result.body = buffer
        resolve(result)
      }).catch(reject)
    })

    if (options.timeout) {
      req.setTimeout(options.timeout, function() {
        var e = new Error('Request Timeout')
        e.status = 408
        destroy(req)
        reject(e)
      })
    }

    let source = options.source
    let body = options.body

    if (source) {
      if (source instanceof Stream) {
        source.pipe(req)
      } else if (typeof source === 'string') {
        handleFilepath(source)
      } else if (isBuffer(source)) {
        req.end(source)
      }
    } else if (body) {
      if (!isBuffer(body) && typeof body !== 'string') {
        body = JSON.stringify(body)
      }
      req.end(body)
    } else {
      req.end()
    }

    onFinished(req, function(err) {
      if (err) {
        destroy(req)
        reject(err)
      }
    })

    function handleFilepath(filepath) {
      fs.stat(filepath, function(error, stats) {
        if (error) return reject(error)

        req.setHeader('Content-Length', stats.size)
        fs.createReadStream(filepath).pipe(req)
      })
    }
  })
}
