
RacksJS = require '../lib/racks.js'

new RacksJS {
  username: process.argv[2]
  apiKey: process.argv[3]
  verbosity: 0
}, (rs) ->

	rs.servers.all (reply) ->
		reply[0].details (details) ->
			console.log details