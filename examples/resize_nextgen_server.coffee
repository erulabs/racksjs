
RacksJS = require '../lib/racks.js'

new RacksJS {
  username: process.argv[2]
  apiKey: process.argv[3]
  verbosity: 1
}, (rs) ->
	#rs.servers.all (reply) ->
	#	console.log reply


	rs.servers.assume('66ac13a6-cea2-401e-98ef-bede09f35e6b').details (reply) ->
		console.log reply