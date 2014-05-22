# 	coffee cloudimages.coffee -n API_USERNAME API_KEY
#
RacksJS = require '../dist/racks.js'
new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 1
}, (rs) ->

	rs.datacenter = 'IAD'

	#rs.cloudImages.tasks.import 'new_image_name', 'image_mover_dest/977a4e0b-e6eb-4509-be09-4b6c72792b2f.vhd', (reply) ->
	#	console.log reply

	#rs.cloudImages.images.assume('977a4e0b-e6eb-4509-be09-4b6c72792b2f').members (reply) ->
	#	console.log reply

	#rs.cloudImages.tasks.export '977a4e0b-e6eb-4509-be09-4b6c72792b2f', 'image_mover', (reply) ->
	#	console.log reply

	rs.cloudImages.tasks.assume('fa48ca9f-6b6e-4ffe-a380-bcf37247ff7f').details (reply) ->
		console.log reply




