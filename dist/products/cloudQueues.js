(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      queues: {
        model: function(raw) {
          raw.listMessages = function(callback) {
            return rack.get(this._racksmeta.target() + '/claims', callback);
          };
          return raw;
        }
      }
    };
  };

}).call(this);
