# 	coffee -m image_migration.coffee
#
RacksJS = require '../dist/racks.js'

imageUUIDToExport = '15a668e4-7e7b-4b46-9084-532e927f78bc'
fromDC = 'ORD'
toDC = 'ORD'
network = 'internal'
destinationCloudContainer = 'racksjs_image_export_' + imageUUIDToExport
accountA = null
accountB = null

ready = () ->
	return false if !accountA? or !accountB?

	# Set network and datacenter preferences
	accountA.network = network
	accountA.datacenter = fromDC
	# for both accounts
	accountB.network = network
	accountB.datacenter = toDC

	# Get a reference to the image we'd like to export
	imageToExport = accountA.cloudImages.assume(imageUUIDToExport)

	# Add accountB as a member to accountA's imageToExport
	accountA.cloudFiles.container.new({ name: destinationCloudContainer }, () ->
		accountA.cloudImages.tasks.export imageUUIDToExport, destinationCloudContainer, (exportReply) ->
			console.log 'exportReply', exportReply
			# Stream a file to cloud files:
			#	rs.cloudFiles.containers.assume('SOME_CONTAINER_NAME').upload {
			#		stream: request("SOME_URL"),
			#		path: 'myUploadedFilename.ext'
			#	}, (reply) ->
			#		console.log reply.statusCode
	);

