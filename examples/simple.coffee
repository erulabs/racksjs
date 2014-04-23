
RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[2]
  apiKey: process.argv[3]
  verbosity: 5
}, (rs) ->


	rs.nextgen.images.all (images) ->
		console.log images

	#console.log rs.nextgen.images._racksmeta.target()

	#rs.clbs.assume('223797').details (reply) ->
	#	console.log reply

	#rs.datacenter = 'IAD'

	#rs.cloudFiles.containers.all (reply) ->
	#	console.log reply

	#rs.servers.assume('1d790167-341f-4f90-9896-f0820c59a637').setMetadata 
	#	'rax_service_level_automation': 'Complete'
	#rs.nextgen.servers.all (servers) ->
	#	servers.forEach (server) ->
	#		server.changePassword 'prubRuyacEb3spun', (reply) ->
	#			console.log 'server:', server.name, reply

	## NextGen, also known as rs.cloudServersOpenStack, includes all modern Rackspace servers.
	## It's by far the most polished of all the Racksjs components

	## Images and flavors!
	#rs.nextgen.images.all (images) -> console.log images
	#rs.nextgen.flavors.all (flavors) -> console.log flavors

	## Create a new server!
	#rs.nextgen.servers.new {
	#	'name': 'racksjs_test'
	#	'flavorRef': 'performance1-1'
	#	'imageRef': 'f70ed7c7-b42e-4d77-83d8-40fa29825b85'
	#}, (server) ->
	#	## We can poll until the build is complete
	#	server.systemActive (details) ->
	#		console.log 'server object:', server, 'server details', details
	#		server.delete()

	# You dont have to make needless HTTP calls if you already know an assets ID. Just "assume" it exists.
	#rs.servers.assume('8347e953-c865-4742-b0a8-96f2903a89cf').rebuild {
	#	imageRef: '1eb491c1-c5fb-4b34-be53-196a0c0588ba'
	#	flavorRef: '5'
	#}, (reply) ->
	#	console.log reply

	#rs.servers.assume('8347e953-c865-4742-b0a8-96f2903a89cf').setMetadata { 'RackConnectPublicIP': '50.56.51.194 }