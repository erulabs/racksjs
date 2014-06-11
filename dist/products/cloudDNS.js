(function() {
  "use strict";
  module.exports = {
    limits: {
      model: function(raw) {
        return raw;
      }
    },
    domains: {
      _racksmeta: {
        singular: 'domains'
      },
      model: function(raw) {
        raw.details = function(callback) {
          return rack.get(this._racksmeta.target(), callback);
        };
        raw.records = rack.subResource(this, raw.id, 'records');
        raw.subdomains = rack.subResource(this, raw.id, 'subdomains');
        return raw;
      }
    },
    rdns: {
      model: function(raw) {
        return raw;
      }
    }
  };

}).call(this);
