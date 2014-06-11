# 	coffee cloudimages.coffee -n API_USERNAME API_KEY
#
RacksJS = require '../dist/racks.js'

imageToExport = 'SOME_UUID'
destinationCloudContainer = 'cloudContainerName'
accountA = null
accountB = null

ready = () ->
	return false if !accountA? or !accountB?

	accountA.cloudImages.assume(imageToExport).addMember

new RacksJS {
  username: 'accountA_username'
  apiKey: 'accountA_APIKEY'
  verbosity: 1
}, (rackspace) ->
	accountA = rackspace
	ready()

new RacksJS {
  username: 'accountB_username'
  apiKey: 'accountB_APIKEY'
  verbosity: 1
}, (rackspace) ->
	accountB = rackspace
	ready()