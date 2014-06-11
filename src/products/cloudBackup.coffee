"use strict";
# http://docs.rackspace.com/rcbu/api/v1.0/rcbu-devguide/content/operations.html
module.exports =
	configurations:
		_racksmeta:
			noResource: yes
			resourceString: 'backup-configuration'
		model: (raw) ->
			return raw
	agents:
		_racksmeta:
			noResource: yes
			resourceString: 'user/agents'
		model: (raw) ->
			return raw