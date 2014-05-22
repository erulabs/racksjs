# 	coffee cloudimages.coffee -n API_USERNAME API_KEY
#
RacksJS = require '../dist/racks.js'
new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 1
}, (rs) ->

	rs.datacenter = 'DFW'

	#rs.cloudImages.images.assume('977a4e0b-e6eb-4509-be09-4b6c72792b2f').members (reply) ->
	#	console.log reply

	#rs.cloudImages.tasks.export '977a4e0b-e6eb-4509-be09-4b6c72792b2f', 'image_mover', (reply) ->
	#	console.log reply

	rs.cloudImages.tasks.assume('81109dea-5d24-4cff-907c-032d9ebbaf58').details (reply) ->
		console.log reply