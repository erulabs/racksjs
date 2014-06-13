(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      servers: {
        model: function(raw) {
          raw.addresses = function(callback) {
            return rack.get(this._racksmeta.target() + '/ips', callback);
          };
          return raw;
        }
      },
      createImage: function(options, callback) {
        if ((options.name != null) && (options.serverId != null)) {
          return rack.post(this._racksmeta.target() + 'images', {
            "image": options
          }, callback);
        } else {
          return rack.log('Must provide "name" and "serverId" for firstgen.createImage({})');
        }
      },
      images: {
        model: function(raw) {
          return raw;
        }
      },
      flavors: {
        model: function(raw) {
          return raw;
        }
      }
    };
  };

}).call(this);
