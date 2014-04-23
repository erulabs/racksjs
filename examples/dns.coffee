
RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[2]
  apiKey: process.argv[3]
  verbosity: 5
}, (rs) ->


	rs.cloudDNS.domains.new [
		{
			"name": "somemadeupdomaindotcomlol.com",
			"emailAddress": "fake@somemadeupdomaindotcomlol.com"
			"ttl": 3600
		}
	], (reply) ->
		console.log reply


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
