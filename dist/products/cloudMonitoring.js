(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      entities: {
        _racksmeta: {
          dontWrap: true
        },
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw["delete"] = function(callback) {
            return rack["delete"](this._racksmeta.target(), callback);
          };
          raw.update = function(options, callback) {
            return rack.put(this._racksmeta.target(), options, callback);
          };
          raw.listChecks = function(callback) {
            return rack.get(this._racksmeta.target() + '/checks', callback);
          };
          raw.getCheck = function(checkID, callback) {
            return rack.get(this._racksmeta.target() + '/checks/' + checkID, callback);
          };
          raw.createCheck = function(options, callback) {
            return rack.post(this._racksmeta.target() + '/checks', options, callback);
          };
          raw.listAlarms = function(callback) {
            return rack.get(this._racksmeta.target() + '/alarms', callback);
          };
          raw.getAlarm = function(alarmID, callback) {
            return rack.get(this._racksmeta.target() + '/alarms/' + alarmID, callback);
          };
          raw.createAlarm = function(options, callback) {
            return rack.post(this._racksmeta.target() + '/alarms', options, callback);
          };
          return raw;
        }
      },
      audits: {
        _racksmeta: {
          replyString: 'values'
        },
        model: function(raw) {
          return raw;
        }
      },
      checkTypes: {
        _racksmeta: {
          resourceString: 'check_types'
        },
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          return raw;
        }
      },
      monitoringZones: {
        _racksmeta: {
          resourceString: 'monitoring_zones'
        },
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          return raw;
        }
      },
      notifications: {
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          return raw;
        }
      },
      agents: {
        _racksmeta: {
          replyString: 'values'
        },
        model: function(raw) {
          raw.details = function(callback) {
            return rack.get(this._racksmeta.target(), callback);
          };
          raw.connections = function(callback) {
            return rack.get(this._racksmeta.target() + '/connections', callback);
          };
          return raw;
        }
      },
      notification_plans: {
        model: function(raw) {
          return raw;
        }
      },
      overview: function(callback) {
        return rack.get(this._racksmeta.target() + '/views/overview', callback);
      },
      account: function(callback) {
        return rack.get(this._racksmeta.target() + '/account', callback);
      },
      updateAccount: function(options, callback) {
        return rack.put(this._racksmeta.target() + '/account', options, callback);
      },
      limits: function(callback) {
        return rack.get(this._racksmeta.target() + '/limits', callback);
      },
      usage: function(callback) {
        return rack.get(this._racksmeta.target() + '/usage', callback);
      },
      changelogs: function(callback) {
        return rack.get(this._racksmeta.target() + '/changelogs/alarms', callback);
      }
    };
  };

}).call(this);
