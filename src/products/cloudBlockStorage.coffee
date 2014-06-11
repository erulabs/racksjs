"use strict";
# http://docs.rackspace.com/cbs/api/v1.0/cbs-devguide/content/volume.html
module.exports = 
	volumes:
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.delete = (callback) ->
				rack.delete @_racksmeta.target(), callback
			raw.rename = (options, callback) ->
				if typeof options is 'string' then options = { "name": options }
				if !options.volume? then options = { "volume": options }
				rack.put @_racksmeta.target(), options, callback
			raw.snapshot = (options, callback) ->
				if typeof options is 'string' then options = { "snapshot": { "display_name": options } }
				options.snapshot.volume_id = raw.id
				rack.post @cloudBlockStorage._racksmeta.target() + '/snapshots', options, callback
			return raw
	volumeDetails: (callback) ->
		rack.get @_racksmeta.target() + '/volumes/detail', callback
	types:
		_racksmeta:
			replyString: 'volume_types'
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			return raw
	snapshots:
		model: (raw) ->
			return raw
	snapshotDetails: (callback) ->
		rack.get @_racksmeta.target() + '/snapshots/detail', callback