(function() {
  "use strict";
  module.exports = {
    volumes: {
      model: function(raw) {
        raw.details = function(callback) {
          return rack.get(this._racksmeta.target(), callback);
        };
        raw["delete"] = function(callback) {
          return rack["delete"](this._racksmeta.target(), callback);
        };
        raw.rename = function(options, callback) {
          if (typeof options === 'string') {
            options = {
              "name": options
            };
          }
          if (options.volume == null) {
            options = {
              "volume": options
            };
          }
          return rack.put(this._racksmeta.target(), options, callback);
        };
        raw.snapshot = function(options, callback) {
          if (typeof options === 'string') {
            options = {
              "snapshot": {
                "display_name": options
              }
            };
          }
          options.snapshot.volume_id = raw.id;
          return rack.post(this.cloudBlockStorage._racksmeta.target() + '/snapshots', options, callback);
        };
        return raw;
      }
    },
    volumeDetails: function(callback) {
      return rack.get(this._racksmeta.target() + '/volumes/detail', callback);
    },
    types: {
      _racksmeta: {
        replyString: 'volume_types'
      },
      model: function(raw) {
        raw.details = function(callback) {
          return rack.get(this._racksmeta.target(), callback);
        };
        return raw;
      }
    },
    snapshots: {
      model: function(raw) {
        return raw;
      }
    },
    snapshotDetails: function(callback) {
      return rack.get(this._racksmeta.target() + '/snapshots/detail', callback);
    }
  };

}).call(this);
