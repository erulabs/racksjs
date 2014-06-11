"use strict";
# http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ch_api_operations.html
module.exports = 
	networks:
		_racksmeta:
			resourceString: 'os-networksv2'
		model: (raw) ->
			raw.show = (callback) ->
				if raw.label in [ 'public', 'private' ]
					callback({
						network:
							id: raw.id
							label: raw.label
							cidr: undefined
					})
				else
					rack.get @_racksmeta.target(), callback
			raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
			return raw
	flavors:
		model: (raw) ->
			raw.details = (callback) -> rack.get @_racksmeta.target(), callback
			raw.specs = (callback) -> rack.get @_racksmeta.target() + '/os-extra_specs', callback
			return raw
	images:
		model: (raw) ->
			raw.details = (callback) -> rack.get @_racksmeta.target(), callback
			raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
			return raw
	servers:
		_racksmeta:
			requiredFields:
				name: 'string'
				imageRef: 'string'
				flavorRef: 'string'
		model: (raw) ->
			raw.systemActive = (interval, callback) ->
				if typeof interval is 'function'
					callback = interval
					interval = 15 * 1000
				action = () =>
					raw.details (reply) ->
						if reply.status isnt "ACTIVE"
							recurse()
						else
							callback(reply)
				recurse = () => setTimeout(action, interval)
				recurse()
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), (reply) -> callback(reply.server)
			raw.addresses = (callback) ->
				rack.get @_racksmeta.target() + '/ips', callback
			raw.delete = (callback) ->
				rack.delete @_racksmeta.target(), callback
			raw.update = (options, callback) ->
				if !options.server? then options = { "server": options }
				rack.put @_racksmeta.target(), options, callback
			raw.action = (options, callback) ->
				rack.post @_racksmeta.target() + '/action', options, callback
			raw.changePassword = (password, callback) ->
				raw.action { changePassword: { adminPass: password } }, callback
			raw.reboot = (type, callback) ->
				if typeof type is 'function' then cb = type; type = 'SOFT'
				raw.action { reboot: { type: type } }, callback
			raw.rescue = (callback) ->
				raw.action { rescue: null }, callback
			raw.unrescue = (callback) ->
				raw.action { unrescue: null }, callback
			raw.createImage = (options, callback) ->
				if typeof options is 'string' then options = { "createImage": { "name": options } }
				raw.action options, callback
			raw.serverActions = (callback) ->
				rack.get @_racksmeta.target() + '/os-instance-actions', callback
			raw.showServerAction = (id, callback) ->
				rack.get @_racksmeta.target() + '/os-instance-actions/' + id, callback
			raw.resize = (options, callback) ->
				if typeof options == 'string' then options = { "flavorRef": options }
				raw.action { resize: options }, callback
			raw.confirmResize = (callback) ->
				raw.action { confirmResize: null }, callback
			raw.revertResize = (callback) ->
				raw.action { revertResize: null }, callback
			raw.rebuild = (options, callback) ->
				raw.action { rebuild: options }, callback
			raw.attachVolume = (options, callback) ->
				rack.post @_racksmeta.target() + '/os-volume_attachments', options, callback
			raw.volumes = (callback) ->
				rack.get @_racksmeta.target() + '/os-volume_attachments', callback
			raw.volumeDetails = (id, callback) ->
				rack.get @_racksmeta.target() + '/os-volume_attachments/' + id, callback
			raw.detachVolume = (callback) ->
				rack.delete @_racksmeta.target() + '/os-volume_attachments/' + id, callback
			raw.metadata = (callback) ->
				rack.get @_racksmeta.target() + '/metadata', callback
			raw.setMetadata = (options, callback) ->
				if !options.metadata? then options = { 'metadata': options }
				if !callback? then callback = -> return false
				rack.put @_racksmeta.target() + '/metadata', options, callback
			raw.updateMetadata = (options, callback) ->
				if !options.metadata? then options = { 'metadata': options }
				rack.post @_racksmeta.target() + '/metadata', options, callback
			raw.getMetadataItem = (key, callback) ->
				rack.get @_racksmeta.target() + '/metadata/' + key, callback
			raw.setMetadataItem = (key, options, callback) ->
				if !options.metadata? then options = { 'metadata': options }
				rack.put @_racksmeta.target() + '/metadata/' + key, options, callback
			raw.deleteMetadataItem = (key, callback) ->
				rack.delete @_racksmeta.target() + '/metadata/' + key, callback
			raw.getVips = (callback) ->
				rack.get @_racksmeta.target() + '/os-virtual-interfacesv2', callback
			raw.attachNetwork = (options, callback) ->
				if !options.metadata? then options = { 'virtual_interface': options }
				rack.post @_racksmeta.target() + '/os-virtual-interfacesv2', options, callback
			return raw
	keys:
		_racksmeta:
			resourceString: 'os-keypairs'
		model: (raw) ->
			raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), (reply) -> callback(reply)
			return raw