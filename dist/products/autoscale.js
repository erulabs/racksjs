(function() {
  "use strict";
  module.exports = {
    groups: {
      model: function(raw) {
        raw.listPolicies = function(callback) {
          return rack.get(this._racksmeta.target() + '/policies', callback);
        };
        raw.listConfigurations = function(callback) {
          return rack.get(this._racksmeta.target() + '/config', callback);
        };
        return raw;
      }
    }
  };

}).call(this);
