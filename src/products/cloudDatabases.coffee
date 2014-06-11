"use strict";
# http://docs.rackspace.com/cdb/api/v1.0/cdb-devguide/content/API_Operations-d1e2264.html
module.exports = 
	instances:
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.action = (options, callback) ->
				rack.post @_racksmeta.target() + '/action', options, callback
			raw.restart = (callback) ->
				raw.action { restart: {} }, callback
			raw.resize = (flavorRef, callback) ->
				raw.action { resize:
					"flavorRef": flavorRef
				}, callback
			raw.listDatabases = (callback) ->
				rack.get @_racksmeta.target() + '/databases', callback
			raw.listUsers = (callback) ->
				rack.get @_racksmeta.target() + '/users', callback
			raw.listFlavors = (callback) ->
				rack.get @_racksmeta.target() + '/flavors', callback
			raw.listBackups = (callback) ->
				rack.get @_racksmeta.target() + '/backups', callback
			raw.enableRoot = (callback) ->
				rack.post @_racksmeta.target() + '/root', '', callback
			return raw