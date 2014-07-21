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
          return raw;
        }
      }
    };
  };

}).call(this);
