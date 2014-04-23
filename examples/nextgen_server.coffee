RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 1
}, (rs) ->

	#rs.nextgen.servers.new {
	#	'name': 'racksjs_test'
	#	'flavorRef': 'performance1-1'
	#	'imageRef': 'f70ed7c7-b42e-4d77-83d8-40fa29825b85'
	#}, (server) ->
	#	## We can poll until the build is complete
	#	server.systemActive (details) ->
	#		console.log 'server object:', server, 'server details', details
	#		server.delete()#