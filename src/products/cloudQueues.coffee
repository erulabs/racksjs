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
            raw.listMessages = (clientId, options, callback) ->
                url =  @_racksmeta.target() + '/messages?'
                if options?
                    url = url + 'echo=true'
                    rack.https { method: 'GET', url: url, data: {}, headers: { "Client-ID": clientId } }, callback
                else
                    url = url + options
                    rack.https { method: 'GET', url: url, data: {}, headers: { "Client-ID": clientId } }, callback
            raw.createMessage = (clientId, options, callback) ->
                url = @_racksmeta.target() + '/messages'
                rack.https { method: 'POST', url: url, data: options, headers: { "Client-ID": clientId } }, callback
            raw.getMessage = (clientId, messageId, callback) ->
                url =  @_racksmeta.target() + '/messages?'
                if messageId?
                    url = url + 'ids=' + messageId
                    rack.https { method: 'GET', url: url, data: {}, headers: { "Client-ID": clientId } }, callback
                else
                    console.log 'Please provide a message ID'
            return raw
