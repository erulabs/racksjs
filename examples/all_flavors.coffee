
RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 1
}, (rs) ->

	rebuildObj =
		imageRef: '1eb491c1-c5fb-4b34-be53-196a0c0588ba'
		flavorRef: '5'

	rs.servers.assume('8347e953-c865-4742-b0a8-96f2903a89cf').rebuild rebuildObj, (reply) ->
		console.log reply
