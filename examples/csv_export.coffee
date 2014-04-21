
RacksJS = require '../lib/racks.js'

new RacksJS {
  username: process.argv[2]
  apiKey: process.argv[3]
  verbosity: 5
}, (rs) ->


	#rs.firstgen.servers.all (servers) ->
	#	console.log servers

	rs.nextgen.servers.all (servers) ->
		for server in servers
			do ->
				my = server
				my.metadata (metadata) ->
					console.log my.name, metadata

				my.details (details) ->
					console.log my.name, details
