(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      exportImageToAcct: function(imageUUID, target) {
        return true;
      },
      setServerStatusActive: function(serverUUID) {
        return true;
      }
    };
  };

}).call(this);
