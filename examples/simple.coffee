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
RacksJS = require '../dist/racks.js'
new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 1
}, (rs) ->

	#rs.cloudMonitoring.entities.assume('ennd4Vpb5h').details (reply) ->
	#	console.log reply

	rs.cloudMonitoring.entities.assume('ennd4Vpb5h').update {
		ip_addresses: {
			public0_v4: '166.78.215.121'
			private0_v4: '10.182.197.82'
			access_ip1_v4: '166.78.215.121'
		}
	}, (reply) ->
		console.log 'update reply:', reply

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
	#	uri: 'https://servers.api.rackspacecloud.com/v1/ddi/servers/21412173'
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