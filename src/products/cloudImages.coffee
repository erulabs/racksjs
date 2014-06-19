"use strict";
# http://docs.rackspace.com/images/api/v2/ci-devguide/content/API_Operations.html
module.exports = (rack) ->
	images:
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			raw.members = (callback) ->
				rack.get @_racksmeta.target() + '/members​', callback
			raw.addMember = (tenant, callback) ->
				rack.post @_racksmeta.target() + '/members', {
					"member": tenant
				}, callback
			return raw
	tasks:
		model: (raw) ->
			raw.details = (callback) ->
				rack.get @_racksmeta.target(), callback
			return raw
		import: (imageName, imagePath, callback) ->
			rack.post @_racksmeta.target(), {
				"type": "import",
				"input": {
					"image_properties": {
						"name": imageName
					},
					"import_from": imagePath
				}
			}, callback
		export: (imageUUID, container, callback) ->
			rack.post @_racksmeta.target(), {
				"type": "export",
				"input": {
					"image_uuid": imageUUID,
					"receiving_swift_container": container
				}
			}, callback