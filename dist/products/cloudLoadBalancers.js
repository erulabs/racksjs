(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      algorithms: {
        _racksmeta: {
          resourceString: 'loadbalancers/algorithms',
          name: 'algorithms'
        },
        model: function(raw) {
          return raw;
        }
      },
      alloweddomains: {
        _racksmeta: {
          resourceString: 'loadbalancers/alloweddomains',
          name: 'alloweddomains'
        },
        model: function(raw) {
          return raw;
        }
      },
      protocols: {
        _racksmeta: {
          resourceString: 'loadbalancers/protocols',
          name: 'protocols'
        },
        model: function(raw) {
          return raw;
        }
      },
      loadBalancers: {
        _racksmeta: {
          resourceString: 'loadbalancers'
        },
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), function(reply) {
              return callback(reply.loadBalancer);
            });
          };
          raw.update = function(options, callback) {
            return rack.put(this._racksmeta.target(), options, function(reply) {
              return callback(reply);
            });
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          raw.listVirtualIPs = function(callback) {
            return rack.get(this._racksmeta.target() + '/virtualips', callback);
          };
          raw.usage = function(callback) {
            return rack.get(this._racksmeta.target()(' /usage/current', callback));
          };
          raw.getSSL = function(callback) {
            return rack.get(this._racksmeta.target() + '/ssltermination', function(reply) {
              return callback(reply.sslTermination);
            });
          };
          raw.setSSL = function(options, callback) {
            return rack.put(this._racksmeta.target() + '/ssltermination', {
              sslTermination: options
            }, callback);
          };
          raw.disableSSL = function(callback) {
            return rack["delete"](this._racksmeta.target() + '/ssltermination', callback);
          };
          raw.listACL = function(callback) {
            return rack.get(this._racksmeta.target() + '/accesslist', callback);
          };
          raw.nodes = rack.subResource(this, raw.id, 'nodes');
          return raw;
        }
      }
    };
  };

}).call(this);
