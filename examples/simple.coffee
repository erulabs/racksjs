#
# This script is setup to use the username and API provided as commandline arguments (as a simple way of keeping them out of the codebase)
# RacksJS ships with coffeescript examples.
# You can run these by installing coffee-script:
#
# 	sudo npm install -g coffee-script
#
# and then by running them with your API details:
#
# 	coffee nextgen_server.coffee -n API_USERNAME API_KEY
#
request = require 'request'

RacksJS = require '../dist/racks.js'
new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 5
}, (rs) ->

	rs.datacenter = 'IAD'

	# Stream a file to cloud files:
	
	rs.cloudFiles.containers.assume('image_mover_dest').upload {
		stream: request("https://storage101.dfw1.clouddrive.com/v1/MossoCloudFS_907995/image_mover/977a4e0b-e6eb-4509-be09-4b6c72792b2f.vhd?temp_url_sig=041a65f01f0846540a68a428bb55050dad2cdd67&temp_url_expires=1400805151"),
		path: '977a4e0b-e6eb-4509-be09-4b6c72792b2f.vhd'
	}, (reply) ->
		console.log reply.statusCode

	# Upload a file to a cloud files container with an assumed named:
	#rs.cloudFiles.containers.assume('racktest').upload {
	#	file: 'dns.coffee'
	#}, (reply) ->
	#	console.log reply.statusCode

	#rs.nextgen.servers.assume('a65ed620-683e-42d9-8b13-f93c33810623').serverActions (list) ->
	#	console.log list

	#rs.datacenter = 'DFW'

	#rs.cloudDatabases.instances.assume('53bf9382-a54d-4f8f-b157-f954f365be85').enableRoot (reply) ->
	#	console.log reply

	#rs.cloudMonitoring.entities.assume('ennd4Vpb5h').details (reply) ->
	#	console.log reply

	#rs.cloudMonitoring.entities.assume('ennd4Vpb5h').update {
	#	agent_id: '21412173'
	#}, (reply) ->
	#	console.log 'update reply:', reply

	#rs.cloudMonitoring.entities.all (entities) ->
	#	for ent in entities.values
	#		if ent.label is "prodsm05"
	#			console.log ent

	#rs.cloudMonitoring.entities.new {
	#	label: 'prodsm05'
	#	ip_addresses: {
	#		public0_v4: '166.78.215.121'
	#		private0_v4: '10.182.197.82'
	#		access_ip1_v4: '166.78.215.121'
	#	}
	#	managed: true
	#	uri: 'https://servers.api.rackspaceclclououd.com/v1/ddi/servers/21412173'
	#	metadata: {}
	#}, (reply) ->
	#	console.log arguments

	#rs.cloudFilesCDN.containers.all (containers) ->
	#	console.log containers

	#rs.network = 'internal'
	#rs.datacenter = 'IAD'

	#rs.cloudFiles.containers.all (containers) ->
	#	console.log containers

	#rs.nextgen.servers.all (servers) ->
	#	console.log servers

	#rs.nextgen.images.all (images) ->
	#	console.log images

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
	#		server.changePassword 'some_new_password', (reply) ->
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
