"use strict";
# http://docs.rackspace.com/queues/api/v1.0/cq-devguide/content/API_Operations_dle001.html
module.exports = (rack) ->
    queues:
        'new': (rack) ->
            return (options, callback) ->
                if typeof options is 'string'
                    name = options
                else if options.name?
                    name = options.name
                else if options.id?
                    name = options.id
                else
                    rack.logerror 'New Queues require at least a name or id'
                    return false
                rack.put @_racksmeta.target() + '/' + name, {}, (reply) ->
                    if callback?
                        callback reply
        model: (raw) ->
            raw.listMessages = (callback) ->
                rack.get @_racksmeta.target() + '/claims', callback
            raw.delete = (callback) ->
                rack.delete @_racksmeta.target(), callback
            raw.check = (callback) ->
                rack.get @_racksmeta.target(), callback
            raw.setMetadata = (options, callback) ->
                if !options.metadata? then options = { 'metadata': options }
                if !callback? then callback = -> return false
                rack.put @_racksmeta.target() + '/metadata', options, callback
            raw.getMetadata = (key, callback) ->
                rack.get @_racksmeta.target() + '/metadata', callback
            raw.stats = (callback) ->
                rack.get @_racksmeta.target() + '/stats', callback
            return raw
