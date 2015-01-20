#
# This script is setup to use the username and API provided as commandline arguments (as a simple way of keeping them out of the codebase)
# RacksJS ships with coffeescript examples.
# You can run these by installing coffee-script:
#
#   sudo npm install -g coffee-script
#
# and then by running them with your API details:
#
#   coffee nextgen_server.coffee -n API_USERNAME API_KEY
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

    # You can change datacenters or network targets at any time.
    # Every call makes its own lookup via a .target() method in a _racksmeta object
    # which is appended to every instance of every product object
    # .target() is called before every HTTP request, so simply change the
    #
    rs.datacenter = 'ORD' # valid values are ORD, IAD, DFW, LON, AUS, HKG
    #
    # or the
    #
    rs.network = 'public' # valid values are public and internal
    #
    # at any time.

    # Utilies
    #rs.utils.rebuildLB '236777', (result) ->
    #   if result
    #       console.log 'done'

    #rs.nextgen.servers.all (reply) ->
    #   log reply

    # Lets get to some cool stuff

    # CLOUD FILES:
    #
    # Stream a file to cloud files:
    #   rs.cloudFiles.containers.assume('SOME_CONTAINER_NAME').upload {
    #       stream: request("SOME_URL"),
    #       path: 'myUploadedFilename.ext'
    #   }, (reply) ->
    #       console.log reply.statusCode
    #
    # Upload a file to a cloud files container with an assumed named:
    #   rs.cloudFiles.containers.assume('CONTAINER_NAME').upload {
    #       file: 'path_of_file_to_upload'
    #   }, (reply) ->
    #       console.log reply.statusCode

    # rs.cloudFiles.containers.new { name: 'somenewTestContainer' }


    # CLOUD MONITORING

    #rs.cloudMonitoring.agents.assume('SOME_UUID').connections (reply) -> log reply

    #rs.cloudMonitoring.entities.assume('SOME_UUID').details (reply) -> log reply

    #rs.cloudMonitoring.entities.assume('SOME_UUID').update {
    #   ip_addresses: {},
    #   label: 'Some Server Name',
    #   agent_id: 'SOME_UUID'
    #}, (reply) ->
    #   log reply

    #rs.nextgen.servers.assume('SOME_UUID').serverActions (list) ->
    #   console.log list

    #rs.cloudDatabases.instances.assume('SOME_UUID').enableRoot (reply) ->
    #   console.log reply

    #rs.cloudMonitoring.entities.assume('SOME_ID').details (reply) ->
    #   console.log reply

    #rs.cloudMonitoring.entities.assume('SOME_ID').update {
    #   agent_id: 'SOME_ID'
    #}, (reply) ->
    #   console.log 'update reply:', reply

    #rs.cloudMonitoring.entities.all (entities) -> ...

    #rs.cloudMonitoring.entities.new {
    #   label: ''
    #   ip_addresses: {
    #       public0_v4: ''
    #       private0_v4: ''
    #       access_ip1_v4: ''
    #   }
    #   managed: true
    #   uri: ''
    #   metadata: {}
    #}, (reply) ->
    #   console.log arguments

    # Get Check
    #rs.cloudMonitoring.entities.assume(process.argv[5]).getCheck checkID, (reply) -> log reply

    # Create Check
    #rs.cloudMonitoring.entities.assume(process.argv[5]).createCheck { ..jsonstuff.. }, (reply) -> log reply

    # Get Alarm
    #rs.cloudMonitoring.entities.assume(process.argv[5]).getAlarm alarmID, (reply) -> log reply

    # Create Alarm
    #rs.cloudMonitoring.entities.assume(process.argv[5]).createAlarm { ..jsonstuff.. }, (reply) -> log reply


    #rs.cloudFiles.containers.all (containers) ->
    #   console.log containers

    # A lot of products have aliases, for instance, instead of
    # rs.cloudServersOpenStack, you can just say "nextgen"
    #
    #rs.nextgen.servers.all (servers) ->
    #   console.log servers
    #
    #rs.nextgen.images.all (images) ->
    #   console.log images
    #
    # They're just links - so you get the same endpoint URLs:
    #console.log rs.nextgen.images._racksmeta.target()
    #
    # Cloud load balancers...
    #rs.clbs.assume('231229').details (reply) ->
    #   console.log reply

    # Some services which normally return ugly plaintext (like OpenStack's Swift AKA CloudFiles)
    # are wrapped nicely into json and still work with things like RacksJS's .target()
    # see the "plaintext" option within the code
    #
    #rs.cloudFiles.containers.all (reply) ->
    #   console.log reply

    # Override the Rackconnect automation level status for a server
    #rs.servers.assume('SOME_UUID').setMetadata
    #   'rax_service_level_automation': 'Complete'

    #rs.nextgen.servers.all (servers) ->
    #   servers.forEach (server) ->
    #       server.changePassword 'some_new_password', (reply) ->
    #           console.log 'server:', server.name, reply

    ## NextGen, also known as rs.cloudServersOpenStack, includes all modern Rackspace servers.
    ## It's by far the most polished of all the Racksjs components

    ## Images and flavors!
    #rs.nextgen.images.all (images) -> console.log images
    #rs.nextgen.flavors.all (flavors) -> console.log flavors

    ## Create a new server!
    #rs.nextgen.servers.new {
    #   'name': 'racksjs_test'
    #   'flavorRef': 'performance1-1'
    #   'imageRef': 'SOME_UUID'
    #}, (server) ->
    #   ## We can poll until the build is complete
    #   server.systemActive (details) ->
    #       console.log 'server object:', server, 'server details', details
    #       server.delete()

    # You can also create a user with a bootable volume quite easily:
    # rs.servers.new {
    #     'name': 'bootable_volume_test'
    #     'flavorRef': 'compute1-4'
    #     'imageRef': ''
    #     'block_device_mapping_v2': [
    #         {
    #             "boot_index":"0"
    #             "uuid":"753a7703-4960-488b-aab4-a3cdd4b276dc"
    #             "volume_size":"100"
    #             "source_type":"image"
    #             "destination_type":"volume"
    #             "delete_on_termination":false
    #         }
    #     ]
    #     "max_count":1
    #     "min_count":1
    # }, (server) ->

    # You dont have to make needless HTTP calls if you already know an assets ID. Just "assume" it exists.
    #rs.servers.assume('SOME_UUID').rebuild {
    #   imageRef: 'SOME_UUID'
    #   flavorRef: '5'
    #}, (reply) ->
    #   console.log reply

    #rs.servers.assume('SOME_UUID').setMetadata { 'RackConnectPublicIP': 'IPV4_HERE }
