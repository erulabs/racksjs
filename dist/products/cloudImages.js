(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      images: {
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw.members = function(callback) {
            return rack.get(this._racksmeta.target() + '/members​', callback);
          };
          raw.addMember = function(tenant, callback) {
            return rack.post(this._racksmeta.target() + '/members', {
              "member": tenant
            }, callback);
          };
          return raw;
        }
      },
      tasks: {
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          return raw;
        },
        "import": function(imageName, imagePath, callback) {
          return rack.post(this._racksmeta.target(), {
            "type": "import",
            "input": {
              "image_properties": {
                "name": imageName
              },
              "import_from": imagePath
            }
          }, callback);
        },
        "export": function(imageUUID, container, callback) {
          return rack.post(this._racksmeta.target(), {
            "type": "export",
            "input": {
              "image_uuid": imageUUID,
              "receiving_swift_container": container
            }
          }, callback);
        }
      }
    };
  };

}).call(this);
