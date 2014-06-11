"use strict";
# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_Storage_Services-d1e942.html
module.exports = 
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