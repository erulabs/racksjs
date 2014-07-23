(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      queues: {
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
              rack.logerror('New Queues require at least a name or id');
              return false;
            }
            return rack.put(this._racksmeta.target() + '/' + name, {}, function(reply) {
              if (callback != null) {
                return callback(reply);
              }
            });
          };
        },
        model: function(raw) {
          raw.listMessages = function(callback) {
            return rack.get(this._racksmeta.target() + '/claims', callback);
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          raw.check = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw.setMetadata = function(options, callback) {
            if (options.metadata == null) {
              options = {
                'metadata': options
              };
            }
            if (callback == null) {
              callback = function() {
                return false;
              };
            }
            return rack.put(this._racksmeta.target() + '/metadata', options, callback);
          };
          raw.getMetadata = function(key, callback) {
            return rack.get(this._racksmeta.target() + '/metadata', callback);
          };
          raw.stats = function(callback) {
            return rack.get(this._racksmeta.target() + '/stats', callback);
          };
          return raw;
        }
      }
    };
  };

}).call(this);
