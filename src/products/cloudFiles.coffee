"use strict"
querystring = require 'querystring'
# http://docs.rackspace.com/files/api/v1/cf-devguide/content/API_Operations_for_Storage_Services-d1e942.html
module.exports = (rack) ->
    containers:
        _racksmeta:
            # Containers are accessed with a GET directly to the storage endpoint - ie: there is no URL path beyond the product base
            resourceString: ''
            plaintext: yes
        'new': (rack) ->
            return (options, callback) ->
                if typeof options is 'string'
                    name = options
                else if options.name?
                    name = options.name
                else if options.id?
                    name = options.id
                else
                    rack.logerror 'New Cloud Files containers require at least a name or id'
                    return false
                rack.put @_racksmeta.target() + name, {}, (reply) ->
                    if callback?
                        callback reply
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
                delete: (callback) ->
                    rack.delete @_racksmeta.target(), callback
                updateMetadata: (metadata, callback) ->
                    rack.post @_racksmeta.target(), {}, metadata, callback
                bulkDelete: (files, callback) ->
                    if files.length > 10000
                        rack.logerror 'bulkDelete is limited to deleting 10000 items at once. You tried to delete', files.length
                    else
                        fixedFiles = []
                        for file in files
                            fixedFiles.push @name + '/' + file
                        fixedFiles = fixedFiles.join("\n")
                        url = @_racksmeta.target() + '?bulk-delete'
                        rack.logerror 'file list:', fixedFiles
                        rack.https { method: 'DELETE', url: url, data: fixedFiles, headers: {
                            'Content-Type': 'text/plain'
                        } }, callback
                # Delete all files in a very very large container
                forceEmpty: (callback) ->
                    self = @
                    @listObjects (list) ->
                        if list.length > 0
                            self.bulkDelete list, (reply) ->
                                self.forceEmpty(callback)
                        else if callback?
                            callback(true)
                listObjects: (callback) ->
                    rack.https {
                        method: 'GET',
                        plaintext: true,
                        url: @_racksmeta.target()
                    }, callback
                listAllObjects: (callback, marker) ->
                    url = @_racksmeta.target()
                    if marker?
                        url = url + '?marker=' + encodeURIComponent(marker)
                    else
                        @_tmp_allObjects = []
                    rack.https {
                        method: 'GET',
                        plaintext: true,
                        url: url
                    }, (reply) =>
                        @_tmp_allObjects = @_tmp_allObjects.concat(reply)
                        if reply.length is 0
                            callback(@_tmp_allObjects)
                            @_tmp_allObjects = []
                        else
                            @.listAllObjects(callback, reply[reply.length - 1])

                upload: (options, callback) ->
                    if !options?
                        options = {}
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
                            options.path = encodeURIComponent(options.file)
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
