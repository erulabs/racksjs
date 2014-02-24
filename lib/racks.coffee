# Racks.coffee - A javascript SDK for the Rackspace Cloud - https://github.com/erulabs/racksjs
# by Seandon Mooy

"use strict"
module.exports = class RacksJS
	constructor: (@authObj, callback) ->
		@https_node = require 'https'
		@url = require 'url'
		@fs = require 'fs'
		# Defaults
		@authToken = no
		@products = {}
		if !@authObj? then @authObj = {}
		if !@authObj.verbosity? then @verbosity = 0 else @verbosity = @authObj.verbosity
		if !@authObj.endpoint? then @authObj.endpoint = 'https://identity.api.rackspacecloud.com/v2.0'
		if !@authObj.test? then @test = no else @test = @authObj.test
		@buildProducts()
		# Authenticate
		if @authObj.username? and @authObj.apiKey? and callback? then @authenticate @authObj, callback
		@network = 'public'
	log: (message, verbose) ->
		if @verbosity is 1
			console.log message
		else if @verbosity > 1
			if !message? then message = '[DEBUG]'
			console.log message, verbose
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
		# Place the request
		if @verbosity > 3 then @log 'HTTP Request: ', opts
		if @test
			# If we're testing, callback with a mock response instead.
			@mockApi(opts, callback)
		else
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
					if @verbosity > 4 then @log 'HTTP Reply:', reply
					callback reply
				response.on 'error', (error) => @log error, opts
			# Write data down the pipe (in the case of POST and PUTs, etc)
			if opts.data? then request.write opts.data
			request.end()
	get: (url, callback) -> @https { method: 'GET', url: url }, callback
	post: (url, data, callback) -> @https { method: 'POST', url: url, data: data }, callback
	delete: (url, callback) -> @https { method: 'DELETE', url: url }, callback
	put: (url, callback) -> @https { method: 'PUT', url: url }, callback
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
			else
				@log undefined, 'product wrapping failure - contact the developers of racksjs', resource.meta
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
			resource.assume = (obj, callback) =>
				if typeof obj is 'string' then obj = { id: obj }
				if !obj.id? and !obj.name? then return @log '[INFO] .assume() relies on .target() which in turn requires the object argument to have a .id or .name - please define one or the other - alternatively you can pass a string, in which case skinny will assume youre providing an id'
				@buildModel(resource, obj)
			resource.new = (obj, callback) =>
				data = {}
				data[resource._racksmeta.singular] = obj
				replyString = resource._racksmeta.name
				if resource._racksmeta.replyString? then replyString = resource._racksmeta.replyString
				rack.post resource._racksmeta.target(), data, (reply) =>
					if reply[replyString]?
						obj = reply[replyString]
					else if reply[resource._racksmeta.singular]?
						obj = reply[resource._racksmeta.singular]
					else
						return callback(reply)
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
							@endpoints.forEach (endpoint) =>
								if endpoint.region is dc then target = endpoint[rack.network.toLowerCase() + 'URL']
						else
							target = @endpoints[0]
						if typeof target is 'object'
							target = target[rack.network.toLowerCase() + 'URL']
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
			else
				@log 'no product named "' + product.name + '" found in racksjs - please contact the maintainers'
	# A testing API
	mockApi: (opts, callback) ->
		# The authentication call
		if opts.data? and opts.data.match /apiKeyCredentials/
			fakeEndpoints = [ 'http://some-fake-testing-url.com', 0, 1, 2 ]
			return callback({ 
				access:
					token:
						id: 'some-fake-testing-id'
					serviceCatalog: [{
						name: 'cloudServersOpenStack',
						endpoints: fakeEndpoints
					}]
			})
		else 
			callback([
				{ id: 1 },
				{ id: 2 }
			])
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
					return raw
			flavors:
				model: (raw) ->
					raw.details = (callback) -> rack.get @_racksmeta.target(), callback
					return raw
			images:
				model: (raw) ->
					raw.details = (callback) -> rack.get @_racksmeta.target(), callback
					return raw
			servers:
				_racksmeta:
					requiredFields:
						name: 'string'
						imageRef: 'string'
						flavorRef: 'string'
				model: (raw) ->
					raw.details = (callback) -> rack.get @_racksmeta.target(), (reply) -> callback(reply.server)
					raw.addresses = (callback) -> rack.get @_racksmeta.target() + '/ips', callback
					raw.delete = (callback) -> rack.delete @_racksmeta.target(), callback
					raw.action = (obj, callback) -> rack.post @_racksmeta.target() + '/action', obj, callback
					raw.reboot = (type, callback) ->
						if typeof type is 'function' then cb = type; type = 'SOFT'
						raw.action { reboot: { type: type } }, callback
					#raw.createImage = (options, callback) -> raw.action
					raw.resize = (options, callback) ->
						if typeof options == 'string' then options = { "flavorRef": options }
						raw.action { resize: options }, callback
					raw.rebuild = (options, callback) ->
						raw.action { rebuild: options }, callback
					return raw
		# http://docs.rackspace.com/servers/api/v1.0/cs-devguide/content/API_Operations-d1e1720.html
		@cloudServers =
			servers:
				model: (raw) ->
					return raw
			images:
				model: (raw) ->
					return raw
			flavors:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/loadbalancers/api/v1.0/clb-devguide/content/API_Operations-d1e1354.html
		@cloudLoadBalancers =
			algorithms:
				model: (raw) ->
					return raw
			alloweddomains:
				model: (raw) ->
					return raw
			protocols:
				model: (raw) ->
					return raw
			loadBalancers:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_CDN_Services-d1e2386.html
		@cloudFilesCDN = {}
		# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_Storage_Services-d1e942.html
		@cloudFiles =
			containers:
				model: (containerName) ->
					catalog =
						name: containerName
						_racksmeta:
							name: containerName
					return catalog
		# http://docs.rackspace.com/cas/api/v1.0/autoscale-devguide/content/API_Operations.html
		@autoscale =
			groups:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/cbs/api/v1.0/cbs-devguide/content/volume.html
		@cloudBlockStorage =
			volumes:
				model: (raw) ->
					return raw
			types:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/cdb/api/v1.0/cdb-devguide/content/API_Operations-d1e2264.html
		@cloudDatabases =
			instances:
				model: (raw) ->
					return raw
		# NO DOCUMENTATION AVAILABLE
		@cloudOrchestration = {}
		# http://docs.rackspace.com/queues/api/v1.0/cq-devguide/content/API_Operations_dle001.html
		@cloudQueues =
			queues:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/rcbu/api/v1.0/rcbu-devguide/content/operations.html
		@cloudBackup =
			configurations:
				model: (raw) ->
					return raw
			agents:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/cdns/api/v1.0/cdns-devguide/content/API_Operations-d1e2264.html
		@cloudDNS =
			limits:
				model: (raw) ->
					return raw
			domains:
				model: (raw) ->
					return raw
			rdns:
				model: (raw) ->
					return raw
		# http://docs.rackspace.com/images/api/v2/ci-devguide/content/API_Operations.html
		@cloudImages = {}
		# http://docs.rackspace.com/cm/api/v1.0/cm-devguide/content/service-api-operations.html
		@cloudMonitoring =
			entities:
				model: (raw) ->
					return raw
			limits:
				model: (raw) ->
					return raw
			audits:
				model: (raw) ->
					return raw
			checkTypes:
				model: (raw) ->
					return raw
			monitoringZones:
				model: (raw) ->
					return raw
			notifications:
				model: (raw) ->
					return raw
			agents:
				model: (raw) ->
					return raw
			overview : (callback) ->
				rack.get @_racksmeta.target() + 'views/overview', callback
		# Shortcuts:
		@servers = @cloudServersOpenStack.servers
		@networks = @cloudServersOpenStack.networks
		@ngservers = @cloudServersOpenStack.servers
		@nextgen = @cloudServersOpenStack
		@fgservers = @cloudServers.servers
		@firstgen = @cloudServers
		@clbs = @cloudLoadBalancers.loadBalancers