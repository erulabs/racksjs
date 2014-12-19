(function() {
  "use strict";
  var querystring;

  querystring = require('querystring');

  module.exports = function(rack) {
    return {
      containers: {
        _racksmeta: {
          resourceString: '',
          plaintext: true
        },
        'new': function(rack) {
          return function(options, callback) {
            var name;
            if (typeof options === 'string') {
              name = options;
            } else if (options.name != null) {
              name = options.name;
            } else if (options.id != null) {
              name = options.id;
            } else {
              rack.logerror('New Cloud Files containers require at least a name or id');
              return false;
            }
            return rack.put(this._racksmeta.target() + name, {}, function(reply) {
              if (callback != null) {
                return callback(reply);
              }
            });
          };
        },
        model: function(containerName) {
          if (containerName.id != null) {
            containerName = containerName.id;
          }
          if (containerName.name != null) {
            containerName = containerName.name;
          }
          return {
            name: containerName,
            _racksmeta: {
              name: containerName
            },
            details: function(callback) {
              return rack.get(this._racksmeta.target(), callback);
            },
            "delete": function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            },
            updateMetadata: function(metadata, callback) {
              return rack.post(this._racksmeta.target(), {}, metadata, callback);
            },
            bulkDelete: function(files, callback) {
              var file, fixedFiles, url, _i, _len;
              if (files.length > 10000) {
                return rack.logerror('bulkDelete is limited to deleting 10000 items at once. You tried to delete', files.length);
              } else {
                fixedFiles = [];
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  fixedFiles.push(this.name + '/' + file);
                }
                fixedFiles = fixedFiles.join("\n");
                url = this._racksmeta.target() + '?bulk-delete';
                rack.logerror('file list:', fixedFiles);
                return rack.https({
                  method: 'DELETE',
                  url: url,
                  data: fixedFiles,
                  headers: {
                    'Content-Type': 'text/plain'
                  }
                }, callback);
              }
            },
            forceEmpty: function(callback) {
              var self;
              self = this;
              return this.listObjects(function(list) {
                if (list.length > 0) {
                  return self.bulkDelete(list, function(reply) {
                    return self.forceEmpty(callback);
                  });
                } else if (callback != null) {
                  return callback(true);
                }
              });
            },
            listObjects: function(callback) {
              return rack.https({
                method: 'GET',
                plaintext: true,
                url: this._racksmeta.target()
              }, callback);
            },
            listAllObjects: function(callback, marker) {
              var url;
              url = this._racksmeta.target();
              if (marker != null) {
                url = url + '?marker=' + encodeURIComponent(marker);
              } else {
                this._tmp_allObjects = [];
              }
              return rack.https({
                method: 'GET',
                plaintext: true,
                url: url
              }, (function(_this) {
                return function(reply) {
                  _this._tmp_allObjects = _this._tmp_allObjects.concat(reply);
                  if (reply.length === 0) {
                    callback(_this._tmp_allObjects);
                    return _this._tmp_allObjects = [];
                  } else {
                    return _this.listAllObjects(callback, reply[reply.length - 1]);
                  }
                };
              })(this));
            },
            upload: function(options, callback) {
              var apiStream, inputStream, url;
              if (options == null) {
                options = {};
              }
              if (callback == null) {
                callback = function() {
                  return false;
                };
              }
              if (options.headers == null) {
                options.headers = {};
              }
              if (options.file != null) {
                inputStream = rack.fs.createReadStream(options.file);
                options.headers['content-length'] = rack.fs.statSync(options.file).size;
              } else if (options.stream != null) {
                inputStream = options.stream;
              }
              if (options.path == null) {
                if (options.file != null) {
                  options.path = encodeURIComponent(options.file);
                } else {
                  options.path = 'STREAM';
                }
              }
              inputStream.on('response', function(response) {
                return response.headers = {
                  'content-type': response.headers['content-type'],
                  'content-length': response.headers['content-length']
                };
              });
              options.method = 'PUT';
              options.headers['X-Auth-Token'] = rack.authToken;
              options.upload = true;
              url = rack.url.parse(this._racksmeta.target());
              options.host = url.host;
              options.path = url.path + '/' + options.path;
              options.container = this.name;
              apiStream = rack.https_node.request(options, callback);
              if (inputStream) {
                inputStream.pipe(apiStream);
              }
              return apiStream;
            }
          };
        }
      }
    };
  };

}).call(this);
