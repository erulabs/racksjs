"use strict";
# http://docs.rackspace.com/servers/api/v1.0/cs-devguide/content/API_Operations-d1e1720.html
module.exports = (rack) ->
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
                rack.get @_racksmeta.target(), (reply) ->
                    callback(reply.loadBalancer)
            raw.update = (options, callback) ->
                rack.put @_racksmeta.target(), options, (reply) ->
                    callback(reply)
            raw.delete = (callback) ->
                rack.delete @_racksmeta.target(), callback
            raw.listVirtualIPs = (callback) ->
                rack.get @_racksmeta.target() + '/virtualips', callback
            raw.usage = (callback) ->
                rack.get @_racksmeta.target() ' /usage/current', callback
            raw.getSSL = (callback) ->
                rack.get @_racksmeta.target() + '/ssltermination', (reply) ->
                    callback(reply.sslTermination)
            raw.setSSL = (options, callback) ->
                rack.put @_racksmeta.target() + '/ssltermination', { sslTermination: options }, callback
            raw.disableSSL = (callback) ->
                rack.delete @_racksmeta.target() + '/ssltermination', callback
            # These do not target correctly
            #raw.sessionpersistence =
            #   list: (callback) -> rack.get @_racksmeta.target() + '/sessionpersistence', callback
            #   enable: (callback) -> rack.put @_racksmeta.target() + '/sessionpersistence', callback
            #   disable: (callback) -> rack.delete @_racksmeta.target() + '/sessionpersistence', callback
            #raw.connectionlogging =
            #   list: (callback) -> rack.get @_racksmeta.target() + '/connectionlogging', callback
            #   enable: (callback) -> rack.put @_racksmeta.target() + '/connectionlogging?enabled=true', callback
            #   disable: (callback) -> rack.put @_racksmeta.target() + '/connectionlogging?enabled=false', callback
            raw.listACL = (callback) -> rack.get @_racksmeta.target() + '/accesslist', callback
            raw.nodes = rack.subResource @, raw.id, 'nodes'
            return raw
