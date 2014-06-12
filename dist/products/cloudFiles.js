(function() {
  "use strict";
  module.exports = {
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
          listObjects: function(callback) {
            return rack.https({
              method: 'GET',
              plaintext: true,
              url: this._racksmeta.target()
            }, cb);
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
                options.path = rack.path.basename(options.file);
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

}).call(this);
