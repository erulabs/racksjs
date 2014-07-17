"use strict";
# http://docs.rackspace.com/queues/api/v1.0/cq-devguide/content/API_Operations_dle001.html
module.exports = (rack) ->
	queues:
		'new': (rack) ->
			return (options, callback) ->
				if typeof options is 'string'
					name = options
				else if options.name?
					name = options.name
				else if options.id?
					name = options.id
				else
					rack.logerror 'New Queues require at least a name or id'
					return false
				rack.put @_racksmeta.target() + '/' + name, {}, (reply) ->
					if callback?
						callback reply
		model: (raw) ->
			raw.listMessages = (callback) ->
				rack.get @_racksmeta.target() + '/claims', callback
			return raw
