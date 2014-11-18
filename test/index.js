'use strict';

var assert = require('assert'),
  parse = require('co-body'),
  equal = assert.deepEqual,
  request = require('..'),
  path = require('path'),
  resolve = path.resolve,
  koa = require('koa'),
  fs = require('fs'),
  join = path.join,
  app = koa();

app.use(function * (next) {
  yield * next;

  if (this.path === '/json') {
    this.body = yield parse(this);
    return;
  }

  if (this.path === '/string') {
    this.body = yield parse(this);
    this.body = JSON.stringify(this.body);
    return;
  }

  if (this.path.startsWith('/dest')) {
    this.body = fs.createReadStream(__filename);
    return;
  }

  if (this.path === '/timeout') {
    yield delay(10000);
    return;
  }

  if (this.path.startsWith('/upload')) {
    var filepath = join(__dirname, this.path + '.temp');

    yield save(this, filepath);

    this.body = {
      filepath: filepath
    };
    return;
  }
});

app.listen(3000);

before(function() {
  var uploadDir = join(__dirname, 'upload');

  try {
    fs.mkdirSync(uploadDir);
  } catch (e) {}
});

describe('## tiny-request', function() {
  describe('# options.source', function() {
    it('stream', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/stream',
        source: fs.createReadStream(__filename)
      }, function(err, res) {
        if (err) throw err;
        assertFileEqual(__filename, 'upload/stream.temp');
        equal(res.status, 200);
        done();
      });
    });

    it('buffer', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/buffer',
        source: new Buffer('test')
      }, function(err, res) {
        if (err) throw err;
        equal(fs.readFileSync(resolve(__dirname, 'upload/buffer.temp'), 'utf8'), 'test');
        equal(res.status, 200);
        done();
      });
    });

    it('filepath', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/file',
        source: __filename
      }, function(err, res) {
        if (err) throw err;
        assertFileEqual(__filename, 'upload/file.temp');
        equal(res.status, 200);
        done();
      });
    });

    it('invalid filepath', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        method: 'POST',
        path: '/upload/file',
        source: __filename + 'xx'
      }, function(err) {
        equal(err.code, 'ENOENT');
        done();
      });
    });
  });

  describe('# options.dest', function() {
    it('stream', function(done) {
      var filepath = join(__dirname, 'upload/stream-dest.js');

      request({
        host: 'localhost',
        port: 3000,
        method: 'GET',
        path: '/dest/stream',
        dest: fs.createWriteStream(filepath)
      }, function(err, res) {
        if (err) throw err;
        assertFileEqual(__filename, 'upload/stream-dest.js');
        equal(res.status, 200);
        done();
      });
    });

    it('filepath', function(done) {
      var filepath = join(__dirname, 'upload/filepath-dest.js');

      request({
        host: 'localhost',
        port: 3000,
        method: 'GET',
        path: '/dest/stream',
        dest: filepath
      }, function(err, res) {
        if (err) throw err;
        assertFileEqual(__filename, 'upload/filepath-dest.js');
        equal(res.status, 200);
        done();
      });
    });
  });

  describe('# options.body', function() {
    it('json', function(done) {
      var json = {
        name: 'test'
      };

      request({
        host: 'localhost',
        port: 3000,
        body: json,
        method: 'POST',
        path: '/json',
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, res) {
        if (err) throw err;
        equal(JSON.parse(res.body), json);
        done();
      });
    });

    it('string', function(done) {
      var json = {
        name: 'test'
      };

      request({
        host: 'localhost',
        port: 3000,
        body: json,
        method: 'POST',
        path: '/string',
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, res) {
        if (err) throw err;
        equal(res.body.toString(), JSON.stringify(json));
        done();
      });
    });
  });

  describe('# timeout', function() {
    it('408', function(done) {
      request({
        host: 'localhost',
        port: 3000,
        timeout: 100,
        path: '/timeout'
      }, function(err) {
        equal(err.status, 408);
        equal(err.message, 'Request Timeout');
        done();
      });
    });
  });
});

function assertFileEqual(path1, path2) {
  path1 = resolve(__dirname, path1);
  path2 = resolve(__dirname, path2);

  var file1 = fs.readFileSync(path1, 'utf8'),
    file2 = fs.readFileSync(path2, 'utf8');

  equal(file1, file2);
}

function save(ctx, filepath) {
  return new Promise(function(resolve, reject) {
    var dest = fs.createWriteStream(filepath);

    ctx.req.pipe(dest);

    dest.on('finish', function() {
      resolve();
    }).on('error', function(error) {
      reject(error);
    });
  });
}

function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, ms);
  });
}
