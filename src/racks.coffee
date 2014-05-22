# Racks.coffee - A javascript SDK for the Rackspace Cloud - https://github.com/erulabs/racksjs
# by Seandon Mooy
"use strict"
module.exports = class RacksJS
	constructor: (@authObj, callback) ->
		@https_node = require 'https'
		@url = require 'url'
		@fs = require 'fs'
		@path = require 'path'
		# Defaults
		@authToken = no
		@products = {}
		unless @authObj? then @authObj = {}
		# Default verbosity
		unless @authObj.verbosity?
			@verbosity = 0
		else
			@verbosity = @authObj.verbosity
		# Default endpoint (Rackspace v2.0 api)
		unless @authObj.endpoint?
			@authObj.endpoint = 'https://identity.api.rackspacecloud.com/v2.0'
		# Test mode
		if !@authObj.test? then @test = no else @test = @authObj.test
		unless @authObj.network?
			@network = 'public'
		else
			@network = @authObj.network
		# Fix a common mistake - the networks are 'public' and 'internal'...
		if @network not in [ 'private', 'internal' ]
			@network = 'public'
		# Colors for console output:
		@clr = { red: "\u001b[31m", blue: "\u001b[34m", green: "\u001b[32m", cyan: "\u001b[36m", gray: "\u001b[1;30m", reset: "\u001b[0m" }
		# HTTP human readable codes from Rackspace API docs
		@httpCodes =
			'200': 'OK'
			'202': 'Accepted'
			'204': 'No Content'
			'400': 'Compute Fault / Bad Request'
			'401': 'Unauthorized'
			'403': 'Forbidden'
			'404': 'Not found'
			'413': 'Over API limits'
			'415': 'Bad Media Type'
			'503': 'Service Unavailable'
		# Build the service catalog 
		@buildProducts()
		# Authenticate
		if @authObj.username? and @authObj.apiKey? and callback? then @authenticate @authObj, callback
	log: (message, verbose) ->
		if @verbosity is 0 then return false
		date = new Date()
		process.stdout.write(date.getMonth() + '/' + date.getDate() + ' ' + date.toTimeString().split(' ')[0] + ' ')
		console.log.apply(@, arguments)
	https: (opts, callback) ->
		if !opts.headers? then opts.headers = {}
		# Save the plaintext option, but don't pass it along to HTTPS
		plaintext = opts.plaintext
		delete opts.plaintext
		# Send along auth token if we have one
		if @authToken then opts.headers['X-Auth-Token'] = @authToken
		# Always use JSON
		opts.headers['Content-Type'] = 'application/json'
		# If we have data, JSON.stringify if needed and calc length
		if opts.data?
			if typeof opts.data is 'object' then opts.data = JSON.stringify(opts.data)
			opts.headers['Content-Length'] = opts.data.length
		# Parse the passed URL for easy use with Node's HTTPS, but don't pass along the unneeded full URL
		opts.url = @url.parse opts.url
		opts.host = opts.url.host
		opts.path = opts.url.path
		delete opts.url
		# Logging
		if @verbosity is 1
			@log @clr.cyan + opts.method + @clr.reset + ':', opts.path
		else if @verbosity > 1
			@log @clr.cyan + 'Request' + @clr.reset + ':', opts
		# Make the HTTP request
		if @test
			# If we're testing, callback with a mock response instead.
			@mockApi(opts, callback)
		else
			# Place the request
			request = @https_node.request opts, (response) =>
				rawReply = ''
				response.setEncoding 'utf8'
				# Collect data
				response.on 'data', (responseChunk) => rawReply = rawReply + responseChunk
				# Response end
				response.on 'end', () =>
					# Parse reply
					if plaintext
						if rawReply.length is 0
							reply = []
						else
							reply = rawReply.substr(0, rawReply.length-1).split "\n"
					else
						try reply = JSON.parse rawReply
						catch error then reply = rawReply
					# Log and callback
					if @verbosity > 0 and @verbosity < 4
						@log @clr.green + 'Reply' + @clr.reset + ':', response.statusCode, @httpCodes[response.statusCode]
					else if @verbosity > 3
						@log @clr.green + 'Reply' + @clr.reset + ':', reply
					callback reply
				response.on 'error', (error) => @log error, opts
			# Write data down the pipe (in the case of POST and PUTs, etc)
			if opts.data? then request.write opts.data
			request.end()
	get: (url, callback) -> @https { method: 'GET', url: url }, callback
	post: (url, data, callback) -> @https { method: 'POST', url: url, data: data }, callback
	delete: (url, callback) -> 
		unless callback?
			callback = () -> return false
		@https { method: 'DELETE', url: url }, callback
	put: (url, data, callback) -> @https { method: 'PUT', url: url, data: data }, callback
	authenticate: (authObj, callback) ->
		if !authObj.username? or !authObj.apiKey? then return callback { error: 'No username or apiKey provided to .authenticate()' }
		@post authObj.endpoint + '/tokens', {
			'auth':
				'RAX-KSKEY:apiKeyCredentials':
					'username': authObj.username
					'apiKey': authObj.apiKey
		}, (response) =>
			if response.access?
				@authToken = response.access.token.id
				@access = response.access
				@error = false
				@serviceCatalog = response.access.serviceCatalog
				@buildCatalog @serviceCatalog
			else
				@log 'Auth failed', response
				@error = 'Auth failed'
			callback @
	# buildModel - wraps each item in typical API response arrays. In other words, for a list of servers, each server (which is a {}),
	# gets appended with a bunch of functionality (whatever is in its .model()), some metadata which is nice for scripting
	# and most importantly, a target function
	buildModel: (template, raw) ->
		rack = @
		if template.model? then model = template.model raw else return raw
		model._racksmeta =
			resource: template._racksmeta.name
			product: template._racksmeta.product
			target: () =>
				target = template._racksmeta.target()
				idOrName = ''
				if target.substr(-1) is '/' then target = target.substr(0, target.length - 1)
				if model.id?
					idOrName = model.id
				else if model.name?
					idOrName = model.name
				return target + '/' + idOrName
		return model
	resourceRequest: (resource, callback) ->
		@https {
			url: resource._racksmeta.target()
			plaintext: resource._racksmeta.plaintext
			method: 'GET'
		}, (reply) =>
			metaName = resource._racksmeta.name
			if resource._racksmeta.replyString? then metaName = resource._racksmeta.replyString
			# Most good API resources reply this way: ie: get /servers (what we call servers.all())
			# respond with { servers: [ {}, {}, {} ... ] }
			# which is exactly what we want - all we do is strip the outer { servers: } object
			# and pass the array that was requested
			if reply[metaName]?
				if resource.model
					# If we got back an array, loop thru the reply objects and "buildProduct"
					if reply[metaName].push?
						response = []
						reply[metaName].forEach (raw) =>
							response.push @buildModel resource, raw
						callback response
					else
						callback @buildModel resource, reply[metaName]
				else
					callback reply[metaName]
			else if resource._racksmeta.plaintext?
				response = []
				reply.forEach (raw) =>
					response.push @buildModel resource, raw
				callback response
			else if callback?
				callback reply
	subResource: (resource, id, subResource) ->
		@buildResource resource._racksmeta.product, resource._racksmeta.name + '/' + subResource, {
			_racksmeta: 
				resourceString: subResource,
				name: subResource,
				target: () => return resource._racksmeta.target() + '/' + id + '/' + subResource
		}
	buildResource: (productName, resourceName, subResource) ->
		if subResource? then resource = subResource else resource = @[productName][resourceName]
		if !resource._racksmeta? then resource._racksmeta = {}
		if !resource._racksmeta.name? then resource._racksmeta.name = resourceName
		if !resource._racksmeta.singular?
			if resource._racksmeta.name.substr(-1) is 's'
				resource._racksmeta.singular = resource._racksmeta.name.substr(0, resource._racksmeta.name.length-1)
			else
				resource._racksmeta.singular = resource._racksmeta.name
		resource._racksmeta.product = productName
		rack = @
		if !resource._racksmeta.target? then resource._racksmeta.target = () ->
			if resource._racksmeta.resourceString? then resourcePath = resource._racksmeta.resourceString else resourcePath = @name
			return rack[productName]._racksmeta.target() + resourcePath
		unless resource._racksmeta.noResource
			resource.all = (callback) =>
				@resourceRequest resource, callback
			resource.assume = (obj) =>
				if typeof obj is 'string'
					obj = { id: obj }
				if !obj.id? and !obj.name? then return @log '[INFO] .assume() relies on .target() which in turn requires the object argument to have a .id or .name - please define one or the other - alternatively you can pass a string, in which case skinny will assume youre providing an id'
				@buildModel(resource, obj)
			resource.new = (obj, callback) =>
				data = {}
				# This is a bug with CloudMonitoring - post requests are NOT wrapped with the resource object title
				if resource._racksmeta.dontWrap?
					data = obj
				else
					data[resource._racksmeta.singular] = obj
				if resource._racksmeta.replyString?
					replyString = resource._racksmeta.replyString
				else
					replyString = resource._racksmeta.name
				rack.post resource._racksmeta.target(), data, (reply) =>
					if reply[replyString]?
						obj = reply[replyString]
					else if reply[resource._racksmeta.singular]?
						obj = reply[resource._racksmeta.singular]
					else
						return callback(reply)
					if callback?
						callback(rack.buildModel(resource, obj))
		return resource
	buildCatalog: (serviceCatalog) ->
		rack = @
		serviceCatalog.forEach (product) =>
			if !product.name? then return false
			if @[product.name]?
				@[product.name]._racksmeta = {
					endpoints: product.endpoints
					target: () ->
						target = false
						if rack.datacenter? then dc = rack.datacenter else dc = rack.access.user['RAX-AUTH:defaultRegion']
						if @endpoints.length > 1
							# Based on the rack.network and chosen datacenter, target() searches the available endpoints
							@endpoints.forEach (endpoint) =>
								if endpoint.region is dc then target = endpoint[rack.network.toLowerCase() + 'URL']
								#console.log 'rack.network is', rack.network, 'and the result is:', target, 'available endpoints are', @endpoints
						else
							target = @endpoints[0]
						if typeof target is 'object'
							target = target[rack.network.toLowerCase() + 'URL']
						if rack.test
							target = 'https://MOCKAPI'
						if target.substr(-1) isnt '/' then target = target + '/'
						return target
				}
				# Build out .products, which isolates the product catalog for tools like RacksUI - ie:
				# make it friendlier to code against, less friendly to script against.
				# RacksJS.products is, after an authentication, a kind of suped serviceCatalog - or rather, the full formal name
				# ie:
				# shortcut/script style -> formal/normal style used in documentation -> full path
				# rs.servers -> rs.cloudServersOpenStack.servers -> rs.products.cloudServersOpenStack.servers
				@products[product.name] = {}
				for resourceName, resource of @[product.name]
					if @[product.name].hasOwnProperty resourceName
						if resourceName isnt '_racksmeta'
							@[product.name][resourceName] = @buildResource product.name, resourceName
							@products[product.name][resourceName] = @[product.name][resourceName]
			else if @verbosity > 3
				@log 'no product named "' + product.name + '" found in racksjs - please contact the maintainers'
	# A testing API
	mockApi: (opts, callback) ->
		# Fake reply object:
		fakeReply = [
			{
				id: 1,
				'_racksmeta':
					name: 'cloudServersOpenStack'
			},
			{
				id: 2,
				'_racksmeta':
					name: 'cloudServersOpenStack'
			},
		]
		# The authentication call
		if !opts.data?
			return callback(fakeReply)
		if opts.data.match /apiKeyCredentials/
			fakeEndpoints = [ 'http://MOCKAPI', 0, 1, 2 ]
			cbObj =
				access:
					user:
						'RAX-AUTH:defaultRegion': 'ORD'
					token:
						id: 'some-fake-testing-id'
					serviceCatalog: []
			for product in [ 'cloudServersOpenStack', 'cloudServers', 'cloudLoadBalancers', 'cloudFiles', 'cloudBlockStorage', 'cloudDatabases', 'cloudBackup', 'cloudDNS', 'cloudImages', 'cloudMonitoring' ]
				cbObj.access.serviceCatalog.push {
					name: product,
					endpoints: fakeEndpoints
				}
			return callback(cbObj)
		else
			return callback(fakeReply)

	buildProducts: () ->
		rack = @
		# http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ch_api_operations.html
		@cloudServersOpenStack =
			networks:
				_racksmeta:
					resourceString: 'os-networksv2'
				model: (raw) ->
					raw.show = (callback) ->
						if raw.label in [ 'public', 'private' ]
							callback({
								network:
									id: raw.id
									label: raw.label
									cidr: undefined
							})
						else
							rack.get @_racksmeta.target(), callback
					raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
					return raw
			flavors:
				model: (raw) ->
					raw.details = (callback) -> rack.get @_racksmeta.target(), callback
					raw.specs = (callback) -> rack.get @_racksmeta.target() + '/os-extra_specs', callback
					return raw
			images:
				model: (raw) ->
					raw.details = (callback) -> rack.get @_racksmeta.target(), callback
					raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
					return raw
			servers:
				_racksmeta:
					requiredFields:
						name: 'string'
						imageRef: 'string'
						flavorRef: 'string'
				model: (raw) ->
					raw.systemActive = (interval, callback) ->
						if typeof interval is 'function'
							callback = interval
							interval = 15 * 1000
						action = () =>
							raw.details (reply) ->
								if reply.status isnt "ACTIVE"
									recurse()
								else
									callback(reply)
						recurse = () => setTimeout(action, interval)
						recurse()
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), (reply) -> callback(reply.server)
					raw.addresses = (callback) ->
						rack.get @_racksmeta.target() + '/ips', callback
					raw.delete = (callback) ->
						rack.delete @_racksmeta.target(), callback
					raw.update = (options, callback) ->
						if !options.server? then options = { "server": options }
						rack.put @_racksmeta.target(), options, callback
					raw.action = (options, callback) ->
						rack.post @_racksmeta.target() + '/action', options, callback
					raw.changePassword = (password, callback) ->
						raw.action { changePassword: { adminPass: password } }, callback
					raw.reboot = (type, callback) ->
						if typeof type is 'function' then cb = type; type = 'SOFT'
						raw.action { reboot: { type: type } }, callback
					raw.rescue = (callback) ->
						raw.action { rescue: null }, callback
					raw.unrescue = (callback) ->
						raw.action { unrescue: null }, callback
					raw.createImage = (options, callback) ->
						if typeof options is 'string' then options = { "createImage": { "name": options } }
						raw.action options, callback
					raw.serverActions = (callback) ->
						rack.get @_racksmeta.target() + '/os-instance-actions', callback
					raw.showServerAction = (id, callback) ->
						rack.get @_racksmeta.target() + '/os-instance-actions/' + id, callback
					raw.resize = (options, callback) ->
						if typeof options == 'string' then options = { "flavorRef": options }
						raw.action { resize: options }, callback
					raw.confirmResize = (callback) ->
						raw.action { confirmResize: null }, callback
					raw.revertResize = (callback) ->
						raw.action { revertResize: null }, callback
					raw.rebuild = (options, callback) ->
						raw.action { rebuild: options }, callback
					raw.attachVolume = (options, callback) ->
						rack.post @_racksmeta.target() + '/os-volume_attachments', options, callback
					raw.volumes = (callback) ->
						rack.get @_racksmeta.target() + '/os-volume_attachments', callback
					raw.volumeDetails = (id, callback) ->
						rack.get @_racksmeta.target() + '/os-volume_attachments/' + id, callback
					raw.detachVolume = (callback) ->
						rack.delete @_racksmeta.target() + '/os-volume_attachments/' + id, callback
					raw.metadata = (callback) ->
						rack.get @_racksmeta.target() + '/metadata', callback
					raw.setMetadata = (options, callback) ->
						if !options.metadata? then options = { 'metadata': options }
						if !callback? then callback = -> return false
						rack.put @_racksmeta.target() + '/metadata', options, callback
					raw.updateMetadata = (options, callback) ->
						if !options.metadata? then options = { 'metadata': options }
						rack.post @_racksmeta.target() + '/metadata', options, callback
					raw.getMetadataItem = (key, callback) ->
						rack.get @_racksmeta.target() + '/metadata/' + key, callback
					raw.setMetadataItem = (key, options, callback) ->
						if !options.metadata? then options = { 'metadata': options }
						rack.put @_racksmeta.target() + '/metadata/' + key, options, callback
					raw.deleteMetadataItem = (key, callback) ->
						rack.delete @_racksmeta.target() + '/metadata/' + key, callback
					raw.getVips = (callback) ->
						rack.get @_racksmeta.target() + '/os-virtual-interfacesv2', callback
					raw.attachNetwork = (options, callback) ->
						if !options.metadata? then options = { 'virtual_interface': options }
						rack.post @_racksmeta.target() + '/os-virtual-interfacesv2', options, callback
					return raw
			keys:
				_racksmeta:
					resourceString: 'os-keypairs'
				model: (raw) ->
					raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), (reply) -> callback(reply)
					return raw
		# http://docs.rackspace.com/servers/api/v1.0/cs-devguide/content/API_Operations-d1e1720.html
		# This is very old stuff - First Gen servers. Never use this.
		@cloudServers =
			servers:
				model: (raw) ->
					raw.addresses = (callback) ->
						rack.get @_racksmeta.target() + '/ips', callback
					return raw
			createImage: (options, callback) ->
				if options.name? and options.serverId?
					rack.post @_racksmeta.target() + 'images', { "image": options }, callback
				else
					rack.log 'Must provide "name" and "serverId" for firstgen.createImage({})'
			images:
				model: (raw) ->
					return raw
			flavors:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/loadbalancers/api/v1.0/clb-devguide/content/API_Operations-d1e1354.html
		@cloudLoadBalancers =
			algorithms:
				_racksmeta:
					resourceString: 'loadbalancers/algorithms'
					name: 'algorithms'
				model: (raw) ->
					return raw
			alloweddomains:
				_racksmeta:
					resourceString: 'loadbalancers/alloweddomains'
					name: 'alloweddomains'
				model: (raw) ->
					return raw
			protocols:
				_racksmeta:
					resourceString: 'loadbalancers/protocols'
					name: 'protocols'
				model: (raw) ->
					return raw
			loadBalancers:
				_racksmeta:
					resourceString: 'loadbalancers'
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.listVirtualIPs = (callback) ->
						rack.get @_racksmeta.target() + '/virtualips', callback
					raw.usage = (callback) ->
						rack.get @_racksmeta.target() ' /usage/current', callback
					raw.sessionpersistence =
						list: (callback) -> rack.get @_racksmeta.target() + '/sessionpersistence', callback
						enable: (callback) -> rack.put @_racksmeta.target() + '/sessionpersistence', callback
						disable: (callback) -> rack.delete @_racksmeta.target() + '/sessionpersistence', callback
					raw.connectionlogging =
						list: (callback) -> rack.get @_racksmeta.target() + '/connectionlogging', callback
						enable: (callback) -> rack.put @_racksmeta.target() + '/connectionlogging?enabled=true', callback
						disable: (callback) -> rack.put @_racksmeta.target() + '/connectionlogging?enabled=false', callback
					raw.listACL = (callback) -> rack.get @_racksmeta.target() + '/accesslist', callback
					raw.nodes = rack.subResource @, raw.id, 'nodes'
					return raw
		# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_CDN_Services-d1e2386.html
		# FIXME: This should NOT be it's own product... Otherwise we duplicate a very large amount of code from RacksJS.cloudFiles
		#@cloudFilesCDN =
		#	containers:
		#		_racksmeta:
		#			# Containers are accessed with a GET directly to the storage endpoint - ie: there is no URL path beyond the product base
		#			resourceString: ''
		#			plaintext: yes
		#		model: (containerName) ->
		#			catalog =
		#				name: containerName
		#				_racksmeta:
		#					name: containerName
		#			return catalog
		@cloudFilesCDN = {};
		@cloudBigData = {};
		# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_Storage_Services-d1e942.html
		@cloudFiles =
			containers:
				_racksmeta:
					# Containers are accessed with a GET directly to the storage endpoint - ie: there is no URL path beyond the product base
					resourceString: ''
					plaintext: yes
				model: (containerName) ->
					if containerName.id?
						containerName = containerName.id
					if containerName.name?
						containerName = containerName.name
					return {
						name: containerName
						_racksmeta:
							name: containerName
						details: (callback) ->
							rack.get @_racksmeta.target(), callback
						listObjects: (callback) ->
							rack.https({
								method: 'GET',
								plaintext: true,
								url: this._racksmeta.target()
							}, cb)
						upload: (options, callback) ->
							if !options?
								options = {};
							if !callback?
								callback = () -> return false
							if !options.headers?
								options.headers = {}
							if options.file?
								inputStream = rack.fs.createReadStream(options.file)
								options.headers['content-length'] = rack.fs.statSync(options.file).size
							else if options.stream?
								inputStream = options.stream
							
							if !options.path?
								if options.file?
									options.path = rack.path.basename(options.file)
								else
									options.path = 'STREAM'

							inputStream.on 'response', (response) ->
								response.headers =
									'content-type': response.headers['content-type']
									'content-length': response.headers['content-length']

							options.method = 'PUT'
							options.headers['X-Auth-Token'] = rack.authToken
							options.upload = true
							url = rack.url.parse this._racksmeta.target()
							options.host = url.host
							options.path = url.path + '/' + options.path
							options.container = this.name

							apiStream = rack.https_node.request options, callback
							if inputStream
								inputStream.pipe(apiStream)

							return apiStream

					}
		# http://docs.rackspace.com/cas/api/v1.0/autoscale-devguide/content/API_Operations.html
		@autoscale =
			groups:
				model: (raw) ->
					raw.listPolicies = (callback) ->
						rack.get @_racksmeta.target() + '/policies', callback
					raw.listConfigurations = (callback) ->
						rack.get @_racksmeta.target() + '/config', callback
					return raw
		# http://docs.rackspace.com/cbs/api/v1.0/cbs-devguide/content/volume.html
		@cloudBlockStorage =
			volumes:
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.delete = (callback) ->
						rack.delete @_racksmeta.target(), callback
					raw.rename = (options, callback) ->
						if typeof options is 'string' then options = { "name": options }
						if !options.volume? then options = { "volume": options }
						rack.put @_racksmeta.target(), options, callback
					raw.snapshot = (options, callback) ->
						if typeof options is 'string' then options = { "snapshot": { "display_name": options } }
						options.snapshot.volume_id = raw.id
						rack.post @cloudBlockStorage._racksmeta.target() + '/snapshots', options, callback
					return raw
			volumeDetails: (callback) ->
				rack.get @_racksmeta.target() + '/volumes/detail', callback
			types:
				_racksmeta:
					replyString: 'volume_types'
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					return raw
			snapshots:
				model: (raw) ->
					return raw
			snapshotDetails: (callback) ->
				rack.get @_racksmeta.target() + '/snapshots/detail', callback
		# http://docs.rackspace.com/cdb/api/v1.0/cdb-devguide/content/API_Operations-d1e2264.html
		@cloudDatabases =
			instances:
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.action = (options, callback) ->
						rack.post @_racksmeta.target() + '/action', options, callback
					raw.restart = (callback) ->
						raw.action { restart: {} }, callback
					raw.resize = (flavorRef, callback) ->
						raw.action { resize:
							"flavorRef": flavorRef
						}, callback
					raw.listDatabases = (callback) ->
						rack.get @_racksmeta.target() + '/databases', callback
					raw.listUsers = (callback) ->
						rack.get @_racksmeta.target() + '/users', callback
					raw.listFlavors = (callback) ->
						rack.get @_racksmeta.target() + '/flavors', callback
					raw.listBackups = (callback) ->
						rack.get @_racksmeta.target() + '/backups', callback
					raw.enableRoot = (callback) ->
						rack.post @_racksmeta.target() + '/root', '', callback
					return raw
		# NO DOCUMENTATION AVAILABLE
		@cloudOrchestration = {}
		# http://docs.rackspace.com/queues/api/v1.0/cq-devguide/content/API_Operations_dle001.html
		@cloudQueues =
			queues:
				model: (raw) ->
					raw.listMessages = (callback) ->
						rack.get @_racksmeta.target() + '/claims', callback
					return raw
		# http://docs.rackspace.com/rcbu/api/v1.0/rcbu-devguide/content/operations.html
		@cloudBackup =
			configurations:
				_racksmeta:
					noResource: yes
					resourceString: 'backup-configuration'
				model: (raw) ->
					return raw
			agents:
				_racksmeta:
					noResource: yes
					resourceString: 'user/agents'
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/cdns/api/v1.0/cdns-devguide/content/API_Operations-d1e2264.html
		@cloudDNS =
			limits:
				model: (raw) ->
					return raw
			domains:
				_racksmeta:
					singular: 'domains'
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.records = rack.subResource @, raw.id, 'records'
					raw.subdomains = rack.subResource @, raw.id, 'subdomains'
					return raw
			rdns:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/images/api/v2/ci-devguide/content/API_Operations.html
		@cloudImages =
			images:
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.members = (callback) ->
						rack.get @_racksmeta.target() + '/members​', callback
					raw.addMember = (tenant, callback) ->
						rack.post @_racksmeta.target() + '/members', {
							"member": tenant
						}, callback
					return raw
			tasks:
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					return raw
				import: (imageName, imagePath, callback) ->
					rack.post @_racksmeta.target(), {
						"type": "import",
						"input": {
							"image_properties": {
								"name": imageName
							},
							"import_from": imagePath
						}
					}, callback
				export: (imageUUID, container, callback) ->
					rack.post @_racksmeta.target(), {
						"type": "export",
						"input": {
							"image_uuid": imageUUID,
							"receiving_swift_container": container
						}
					}, callback
		# http://docs.rackspace.com/cm/api/v1.0/cm-devguide/content/service-api-operations.html
		@cloudMonitoring =
			entities:
				_racksmeta:
					dontWrap: yes
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					raw.delete = (callback) ->
						rack.delete @_racksmeta.target(), callback
					raw.update = (options, callback) ->
						rack.put @_racksmeta.target(), options, callback
					raw.listChecks = (callback) ->
						rack.get @_racksmeta.target() + '/checks', callback
					raw.listAlarms = (callback) ->
						rack.get @_racksmeta.target() + '/alarms', callback
					return raw
			audits:
				_racksmeta:
					replyString: 'values'
				model: (raw) ->
					return raw
			checkTypes:
				_racksmeta:
					resourceString: 'check_types'
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					return raw
			monitoringZones:
				_racksmeta:
					resourceString: 'monitoring_zones'
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					return raw
			notifications:
				model: (raw) ->
					raw.details = (callback) ->
						rack.get @_racksmeta.target(), callback
					return raw
			agents:
				_racksmeta:
					replyString: 'values'
				model: (raw) ->
					return raw
			notification_plans:
				model: (raw) ->
					return raw
			overview : (callback) ->
				rack.get @_racksmeta.target() + '/views/overview', callback
			account: (callback) ->
				rack.get @_racksmeta.target() + '/account', callback
			updateAccount: (options, callback) ->
				rack.put @_racksmeta.target() + '/account', options, callback
			limits: (callback) ->
				rack.get @_racksmeta.target() + '/limits', callback
			usage: (callback) ->
				rack.get @_racksmeta.target() + '/usage', callback
			changelogs: (callback) ->
				rack.get @_racksmeta.target() + '/changelogs/alarms', callback


		# Shortcuts:
		@servers = @cloudServersOpenStack.servers
		@networks = @cloudServersOpenStack.networks
		@ngservers = @cloudServersOpenStack.servers
		@nextgen = @cloudServersOpenStack
		@fgservers = @cloudServers.servers
		@firstgen = @cloudServers
		@clbs = @cloudLoadBalancers.loadBalancers
