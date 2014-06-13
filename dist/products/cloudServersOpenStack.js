(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      networks: {
        _racksmeta: {
          resourceString: 'os-networksv2'
        },
        model: function(raw) {
          raw.show = function(callback) {
            var _ref;
            if ((_ref = raw.label) === 'public' || _ref === 'private') {
              return callback({
                network: {
                  id: raw.id,
                  label: raw.label,
                  cidr: void 0
                }
              });
            } else {
              return rack.get(this._racksmeta.target(), callback);
            }
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          return raw;
        }
      },
      flavors: {
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw.specs = function(callback) {
            return rack.get(this._racksmeta.target() + '/os-extra_specs', callback);
          };
          return raw;
        }
      },
      images: {
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          return raw;
        }
      },
      servers: {
        _racksmeta: {
          requiredFields: {
            name: 'string',
            imageRef: 'string',
            flavorRef: 'string'
          }
        },
        model: function(raw) {
          raw.systemActive = function(interval, callback) {
            var action, recurse;
            if (typeof interval === 'function') {
              callback = interval;
              interval = 15 * 1000;
            }
            action = (function(_this) {
              return function() {
                return raw.details(function(reply) {
                  if (reply.status !== "ACTIVE") {
                    return recurse();
                  } else {
                    return callback(reply);
                  }
                });
              };
            })(this);
            recurse = (function(_this) {
              return function() {
                return setTimeout(action, interval);
              };
            })(this);
            return recurse();
          };
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), function(reply) {
              return callback(reply.server);
            });
          };
          raw.addresses = function(callback) {
            return rack.get(this._racksmeta.target() + '/ips', callback);
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          raw.update = function(options, callback) {
            if (options.server == null) {
              options = {
                "server": options
              };
            }
            return rack.put(this._racksmeta.target(), options, callback);
          };
          raw.action = function(options, callback) {
            return rack.post(this._racksmeta.target() + '/action', options, callback);
          };
          raw.changePassword = function(password, callback) {
            return raw.action({
              changePassword: {
                adminPass: password
              }
            }, callback);
          };
          raw.reboot = function(type, callback) {
            var cb;
            if (typeof type === 'function') {
              cb = type;
              type = 'SOFT';
            }
            return raw.action({
              reboot: {
                type: type
              }
            }, callback);
          };
          raw.rescue = function(callback) {
            return raw.action({
              rescue: null
            }, callback);
          };
          raw.unrescue = function(callback) {
            return raw.action({
              unrescue: null
            }, callback);
          };
          raw.createImage = function(options, callback) {
            if (typeof options === 'string') {
              options = {
                "createImage": {
                  "name": options
                }
              };
            }
            return raw.action(options, callback);
          };
          raw.serverActions = function(callback) {
            return rack.get(this._racksmeta.target() + '/os-instance-actions', callback);
          };
          raw.showServerAction = function(id, callback) {
            return rack.get(this._racksmeta.target() + '/os-instance-actions/' + id, callback);
          };
          raw.resize = function(options, callback) {
            if (typeof options === 'string') {
              options = {
                "flavorRef": options
              };
            }
            return raw.action({
              resize: options
            }, callback);
          };
          raw.confirmResize = function(callback) {
            return raw.action({
              confirmResize: null
            }, callback);
          };
          raw.revertResize = function(callback) {
            return raw.action({
              revertResize: null
            }, callback);
          };
          raw.rebuild = function(options, callback) {
            return raw.action({
              rebuild: options
            }, callback);
          };
          raw.attachVolume = function(options, callback) {
            return rack.post(this._racksmeta.target() + '/os-volume_attachments', options, callback);
          };
          raw.volumes = function(callback) {
            return rack.get(this._racksmeta.target() + '/os-volume_attachments', callback);
          };
          raw.volumeDetails = function(id, callback) {
            return rack.get(this._racksmeta.target() + '/os-volume_attachments/' + id, callback);
          };
          raw.detachVolume = function(callback) {
            return rack["delete"](this._racksmeta.target() + '/os-volume_attachments/' + id, callback);
          };
          raw.metadata = function(callback) {
            return rack.get(this._racksmeta.target() + '/metadata', callback);
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
          raw.updateMetadata = function(options, callback) {
            if (options.metadata == null) {
              options = {
                'metadata': options
              };
            }
            return rack.post(this._racksmeta.target() + '/metadata', options, callback);
          };
          raw.getMetadataItem = function(key, callback) {
            return rack.get(this._racksmeta.target() + '/metadata/' + key, callback);
          };
          raw.setMetadataItem = function(key, options, callback) {
            if (options.metadata == null) {
              options = {
                'metadata': options
              };
            }
            return rack.put(this._racksmeta.target() + '/metadata/' + key, options, callback);
          };
          raw.deleteMetadataItem = function(key, callback) {
            return rack["delete"](this._racksmeta.target() + '/metadata/' + key, callback);
          };
          raw.getVips = function(callback) {
            return rack.get(this._racksmeta.target() + '/os-virtual-interfacesv2', callback);
          };
          raw.attachNetwork = function(options, callback) {
            if (options.metadata == null) {
              options = {
                'virtual_interface': options
              };
            }
            return rack.post(this._racksmeta.target() + '/os-virtual-interfacesv2', options, callback);
          };
          return raw;
        }
      },
      keys: {
        _racksmeta: {
          resourceString: 'os-keypairs'
        },
        model: function(raw) {
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), function(reply) {
              return callback(reply);
            });
          };
          return raw;
        }
      }
    };
  };

}).call(this);
