"use strict";
# http://docs.rackspace.com/queues/api/v1.0/cq-devguide/content/API_Operations_dle001.html
module.exports = (rack) ->
	queues:
		model: (raw) ->
			raw.listMessages = (callback) ->
				rack.get @_racksmeta.target() + '/claims', callback
			return raw