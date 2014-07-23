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
          raw.listMessages = function(clientId, options, callback) {
            var url;
            url = this._racksmeta.target() + '/messages?';
            if (options != null) {
              url = url + 'echo=true';
              return rack.https({
                method: 'GET',
                url: url,
                data: {},
                headers: {
                  "Client-ID": clientId
                }
              }, callback);
            } else {
              url = url + options;
              return rack.https({
                method: 'GET',
                url: url,
                data: {},
                headers: {
                  "Client-ID": clientId
                }
              }, callback);
            }
          };
          raw.createMessage = function(clientId, options, callback) {
            var url;
            url = this._racksmeta.target() + '/messages';
            return rack.https({
              method: 'POST',
              url: url,
              data: options,
              headers: {
                "Client-ID": clientId
              }
            }, callback);
          };
          raw.getMessage = function(clientId, messageId, callback) {
            var url;
            url = this._racksmeta.target() + '/messages?';
            if (messageId != null) {
              url = url + 'ids=' + messageId;
              return rack.https({
                method: 'GET',
                url: url,
                data: {},
                headers: {
                  "Client-ID": clientId
                }
              }, callback);
            } else {
              return console.log('Please provide a message ID');
            }
          };
          return raw;
        }
      }
    };
  };

}).call(this);
