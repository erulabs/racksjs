"use strict";

# The goal of the RacksJS utils object is to create meaningful and complex actions and present them in a simple way.
# this means that all functions here should at involve at least two products and more than two operations.
# For instance, a function which transforms a cloud image wouldn't be found here - it would be found in the products/cloudImages...

module.exports = (rack) ->
    # Rebuild a loadbalancer with all details remaining the same (including public IP)
    # THIS IMPLIES SOME DOWNTIME AS WE WILL WAIT FOR OPENSTACK TO TELL US
    # WHEN THE LB IS DELETED BEFORE MOVING THE NEW ONE INTO PLACE.
    # THE DELETION PERIOD CAN BE SUPRISINGLY LONG!!
    # Expect ~5min of downtime!
    rebuildLB: (lbID, callback) ->
        originalLB = rack.clbs.assume(lbID)
        originalLB.details (oldLB) ->
            unless oldLB then return callback rack.logerror 'Target LB ' + lbID + ' does not exist'
            originalLB.getSSL (oldSSL) ->
                # The new load balancer inherits a few known constants:
                newLB =
                    name: oldLB.name
                    protocol: oldLB.protocol
                    # We cannot build this new LB on the same port initially
                    # rather we need to build it on a different one
                    # delete the original, and change this one back.
                    # offset for one is probably bad - we should probably find a free port.
                    port: oldLB.port + 1
                    # These are always present with { enabled: true|false }
                    # so we can just curry them along
                    contentCaching: oldLB.contentCaching
                    connectionLogging: oldLB.connectionLogging
                # Preserve VIPS (to preverse a VIP, openstack only wants us to provide the ID of the VIP),
                # and will get very upset if we give any other information.
                newLB.virtualIps = []
                newLB.virtualIps.push id: vip.id for vip in oldLB.virtualIps
                # Validate nodes (do not includes IDs or status)
                if oldLB.nodes?
                    newLB.nodes = []
                    for node in oldLB.nodes
                        newLB.nodes.push {
                            address: node.address
                            type: node.type
                            port: node.port
                            condition: node.condition
                        }
                #if oldLB.sslTermination? then newLB.sslTermination = oldLB.sslTermination
                if oldLB.healthMonitor? then newLB.healthMonitor = oldLB.healthMonitor
                if oldLB.httpsRedirect? then newLB.httpsRedirect = oldLB.httpsRedirect

                # TODO: ACCESS CONTROL LISTS

                rack.clbs.new(newLB, (newLBObj) ->
                    checkNewLBBuild = false
                    checkBuild = () ->
                        newLBObj.details (reply) ->
                            if reply.status is 'BUILD'
                                return false
                            else if reply.status is 'ACTIVE'
                                rack.log 'New LB built, id:', newLBObj.id
                                originalLB.delete () ->
                                    checkOldLbDelete = false
                                    checkDelete = () ->
                                        originalLB.details (reply) ->
                                            if reply.status is 'PENDING_DELETE'
                                                return false
                                            else if reply.status is 'DELETED'
                                                rack.log 'Original LB', originalLB.id, 'deleted'
                                                setSSL()
                                            else
                                                rack.logerror 'Some other status encountered:', reply
                                            clearInterval checkOldLbDelete
                                    checkOldLbDelete = setInterval checkDelete, 5000
                                    setSSL = () ->
                                        if oldSSL?
                                            newLBObj.setSSL oldSSL, (SSLreply) ->
                                                # todo: validate SSLreply
                                                # todo: wait for LB to be active again
                                                resetPort()
                                        else
                                            resetPort()
                                    resetPort = () ->
                                        newLBObj.update {
                                            port: oldLB.port
                                        }, () ->
                                            rack.log 'The load balancer has been rebuilt!'
                                            rack.log 'it will have almost certainly stayed in the same instance'
                                            rack.log 'so this was rather pointless' + "\n\n\n"
                                            rack.log 'but I had fun!'
                            else
                                rack.logerror 'Some other unexpected build status occured:', reply
                                rack.logerror 'the original load balancer was not deleted.'
                            clearInterval checkNewLBBuild

                    checkNewLBBuild = setInterval checkBuild, 10000
                )
    exportImageToAcct: (imageUUID, target) ->
        # target.datacenter
        # target.account
        return true
    setServerStatusActive: (serverUUID) ->
        return true
