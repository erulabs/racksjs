(function() {
  "use strict";
  module.exports = {
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
          return rack.get(this._racksmeta.target(), callback);
        };
        raw.listVirtualIPs = function(callback) {
          return rack.get(this._racksmeta.target() + '/virtualips', callback);
        };
        raw.usage = function(callback) {
          return rack.get(this._racksmeta.target()(' /usage/current', callback));
        };
        raw.sessionpersistence = {
          list: function(callback) {
            return rack.get(this._racksmeta.target() + '/sessionpersistence', callback);
          },
          enable: function(callback) {
            return rack.put(this._racksmeta.target() + '/sessionpersistence', callback);
          },
          disable: function(callback) {
            return rack["delete"](this._racksmeta.target() + '/sessionpersistence', callback);
          }
        };
        raw.connectionlogging = {
          list: function(callback) {
            return rack.get(this._racksmeta.target() + '/connectionlogging', callback);
          },
          enable: function(callback) {
            return rack.put(this._racksmeta.target() + '/connectionlogging?enabled=true', callback);
          },
          disable: function(callback) {
            return rack.put(this._racksmeta.target() + '/connectionlogging?enabled=false', callback);
          }
        };
        raw.listACL = function(callback) {
          return rack.get(this._racksmeta.target() + '/accesslist', callback);
        };
        raw.nodes = rack.subResource(this, raw.id, 'nodes');
        return raw;
      }
    }
  };

}).call(this);
