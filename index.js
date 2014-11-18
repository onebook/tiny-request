'use strict';

var Stream = require('stream'),
  isBuffer = Buffer.isBuffer,
  concat = Buffer.concat,
  http = require('http'),
  fs = require('fs');

module.exports = request;

/**
 * @param {object} - options
 * @param {function} - callback
 */
function request(options, callback) {
  var called = false;

  var req = http.request(options, function(res) {
    var status = res.statusCode,
      headers = res.headers,
      chunks = [],
      size = 0;

    if (options.dest) {
      return resToDest(options.dest);
    }

    // no dest
    res.on('data', function(chunk) {
      chunks.push(chunk);
      size += chunk.length;
    });

    res.on('end', function() {
      finish({
        status: status,
        headers: headers,
        body: concat(chunks, size)
      });
    });

    function resToDest(dest) {
      if (typeof dest === 'string') {
        dest = fs.createWriteStream(dest);
      }

      if (dest instanceof Stream) {
        res.pipe(dest);

        dest.on('finish', function() {
          finish({
            status: status,
            headers: headers
          });
        });

        dest.on('error', onError);
      }
    }
  });

  if (options.timeout) {
    req.setTimeout(options.timeout, function() {
      var e = new Error('Request Timeout');
      e.status = 408;
      onError(e);
    });
  }

  var source = options.source,
    body = options.body;

  if (source) {
    if (source instanceof Stream) {
      source.pipe(req);
    } else if (typeof source === 'string') {
      handleFilepath(source);
    } else if (isBuffer(source)) {
      req.end(source);
    }
  } else if (body) {
    if (!isBuffer(body) && typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    req.end(body);
  } else {
    req.end();
  }

  req.on('error', onError);

  if (options.timeout) {}

  function handleFilepath(filepath) {
    fs.stat(filepath, function(error, stats) {
      if (error) return onError(error);

      req.setHeader('Content-Length', stats.size);
      fs.createReadStream(filepath).pipe(req);
    });
  }

  function finish(data) {
    if (called) return;

    called = true;
    callback(null, data);
  }

  function onError(error) {
    if (called) return;

    called = true;
    callback(error);
  }
}
