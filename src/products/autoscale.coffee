"use strict";
# http://docs.rackspace.com/cas/api/v1.0/autoscale-devguide/content/API_Operations.html
module.exports = (rack) ->
    groups:
        model: (raw) ->
            raw.listPolicies = (callback) ->
                rack.get @_racksmeta.target() + '/policies', callback
            raw.listConfigurations = (callback) ->
                rack.get @_racksmeta.target() + '/config', callback
            return raw
