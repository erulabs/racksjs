"use strict";
# http://docs.rackspace.com/servers/api/v1.0/cs-devguide/content/API_Operations-d1e1720.html
module.exports = (rack) ->
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
