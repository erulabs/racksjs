(function() {
  "use strict";
  module.exports = {
    instances: {
      model: function(raw) {
        raw.details = function(callback) {
          return rack.get(this._racksmeta.target(), callback);
        };
        raw.action = function(options, callback) {
          return rack.post(this._racksmeta.target() + '/action', options, callback);
        };
        raw.restart = function(callback) {
          return raw.action({
            restart: {}
          }, callback);
        };
        raw.resize = function(flavorRef, callback) {
          return raw.action({
            resize: {
              "flavorRef": flavorRef
            }
          }, callback);
        };
        raw.listDatabases = function(callback) {
          return rack.get(this._racksmeta.target() + '/databases', callback);
        };
        raw.listUsers = function(callback) {
          return rack.get(this._racksmeta.target() + '/users', callback);
        };
        raw.listFlavors = function(callback) {
          return rack.get(this._racksmeta.target() + '/flavors', callback);
        };
        raw.listBackups = function(callback) {
          return rack.get(this._racksmeta.target() + '/backups', callback);
        };
        raw.enableRoot = function(callback) {
          return rack.post(this._racksmeta.target() + '/root', '', callback);
        };
        return raw;
      }
    }
  };

}).call(this);
