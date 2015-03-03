#
# This script is setup to use the username and API provided as commandline arguments (as a simple way of keeping them out of the codebase)
# RacksJS ships with coffeescript examples.
# You can run these by installing coffee-script:
#
# 	sudo npm install -g coffee-script
#
# and then by running them with your API details:
#
# 	coffee cloud_files.coffee -n API_USERNAME API_KEY
#
#request = require 'request'

RacksJS = require '../dist/racks.js'
new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 5
  # To auth against LON
  #endpoint: 'https://lon.identity.api.rackspacecloud.com/v2.0'
}, (rs) ->

	log = console.log

	rs.datacenter = 'IAD'
	#rs.network = 'internal'

	container = rs.files.assume('cdn.example.com')
	container.listObjects (allFiles) ->
		container.bulkDelete allFiles


	#container.forceEmpty()
