RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 2
}, (rs) ->

	rs.cloudQueues.queues.new 'testQ', (resp) ->
		console.log resp
	
	#$console.log rs.cloudQueues.queues.new.toString()
	#console.log rs.files.new.toString()