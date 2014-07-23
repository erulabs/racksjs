RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 5
}, (rs) ->
    #rs.cloudQueues.queues.new 'testQ', (resp) ->
    #    console.log resp
    #rs.cloudQueues.queues.assume('testQ').delete (resp) ->
    #    console.log resp
    #rs.cloudQueues.queues.all (resp) ->
    #    console.log resp
    #rs.cloudQueues.queues.assume('testQ').check (resp) ->
    #    console.log resp
    #rs.cloudQueues.queues.assume('testQ').setMetadata { "testfield" : "testdata" }, (resp, responseObj) ->
    #    console.log responseObj.statusCode
    #rs.cloudQueues.queues.assume('testQ').getMetadata (resp) ->
    #    console.log resp
    #rs.cloudQueues.queues.assume('testQ').stats (resp) ->
    #    console.log resp
    rs.cloudQueues.queues.assume('testQ').listMessages 'e58668fc-26eb-11e3-8270-5b3128d43830', 'echo=true', (resp) ->
        console.log resp






    #console.log rs.cloudQueues.queues.delete.toString()
	#$console.log rs.cloudQueues.queues.new.toString()
	#console.log rs.files.new.toString()
    #console.log rs.cloudQueues.queues.assume('testQ').check.toString()
