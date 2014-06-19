(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      configurations: {
        _racksmeta: {
          noResource: true,
          resourceString: 'backup-configuration'
        },
        model: function(raw) {
          return raw;
        }
      },
      agents: {
        _racksmeta: {
          noResource: true,
          resourceString: 'user/agents'
        },
        model: function(raw) {
          return raw;
        }
      }
    };
  };

}).call(this);
