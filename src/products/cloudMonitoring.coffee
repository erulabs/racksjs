"use strict";
# http://docs.rackspace.com/cm/api/v1.0/cm-devguide/content/service-api-operations.html
module.exports = (rack) ->
	entities:
		_racksmeta:
			dontWrap: yes
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.delete = (callback) ->
				rack.delete @_racksmeta.target(), callback
			raw.update = (options, callback) ->
				rack.put @_racksmeta.target(), options, callback
			raw.listChecks = (callback) ->
				rack.get @_racksmeta.target() + '/checks', callback
			raw.listAlarms = (callback) ->
				rack.get @_racksmeta.target() + '/alarms', callback
                        raw.getCheck = (checkID, callback) ->
                                rack.get @_racksmeta.target() + '/checks/' + checkID, callback
                        raw.createCheck = (options, callback) ->
                                rack.put @_racksmeta.target() + '/checks', options, callback

			return raw
	audits:
		_racksmeta:
			replyString: 'values'
		model: (raw) ->
			return raw
	checkTypes:
		_racksmeta:
			resourceString: 'check_types'
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			return raw
	monitoringZones:
		_racksmeta:
			resourceString: 'monitoring_zones'
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			return raw
	notifications:
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			return raw
	agents:
		_racksmeta:
			replyString: 'values'
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.connections = (callback) ->
				rack.get @_racksmeta.target() + '/connections', callback
			return raw
	notification_plans:
		model: (raw) ->
			return raw
	overview : (callback) ->
		rack.get @_racksmeta.target() + '/views/overview', callback
	account: (callback) ->
		rack.get @_racksmeta.target() + '/account', callback
	updateAccount: (options, callback) ->
		rack.put @_racksmeta.target() + '/account', options, callback
	limits: (callback) ->
		rack.get @_racksmeta.target() + '/limits', callback
	usage: (callback) ->
		rack.get @_racksmeta.target() + '/usage', callback
	changelogs: (callback) ->
		rack.get @_racksmeta.target() + '/changelogs/alarms', callback
