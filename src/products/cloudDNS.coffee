"use strict";
# http://docs.rackspace.com/cdns/api/v1.0/cdns-devguide/content/API_Operations-d1e2264.html
module.exports = (rack) ->
	limits:
		model: (raw) ->
			return raw
	domains:
		_racksmeta:
			singular: 'domains'
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.records = rack.subResource @, raw.id, 'records'
			raw.subdomains = rack.subResource @, raw.id, 'subdomains'
			return raw
	rdns:
		model: (raw) ->
			return raw