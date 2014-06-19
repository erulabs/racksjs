(function() {
  "use strict";
  module.exports = function(rack) {
    return {
      rebuildLB: function(lbID, callback) {
        var originalLB;
        originalLB = rack.clbs.assume(lbID);
        return originalLB.details(function(oldLB) {
          if (!oldLB) {
            return callback(rack.logerror('Target LB ' + lbID + ' does not exist'));
          }
          return originalLB.getSSL(function(oldSSL) {
            var newLB, node, vip, _i, _j, _len, _len1, _ref, _ref1;
            newLB = {
              name: oldLB.name,
              protocol: oldLB.protocol,
              port: oldLB.port + 1,
              contentCaching: oldLB.contentCaching,
              connectionLogging: oldLB.connectionLogging
            };
            newLB.virtualIps = [];
            _ref = oldLB.virtualIps;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              vip = _ref[_i];
              newLB.virtualIps.push({
                id: vip.id
              });
            }
            if (oldLB.nodes != null) {
              newLB.nodes = [];
              _ref1 = oldLB.nodes;
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                node = _ref1[_j];
                newLB.nodes.push({
                  address: node.address,
                  type: node.type,
                  port: node.port,
                  condition: node.condition
                });
              }
            }
            if (oldLB.healthMonitor != null) {
              newLB.healthMonitor = oldLB.healthMonitor;
            }
            if (oldLB.httpsRedirect != null) {
              newLB.httpsRedirect = oldLB.httpsRedirect;
            }
            return rack.clbs["new"](newLB, function(newLBObj) {
              var checkBuild, checkNewLBBuild;
              checkNewLBBuild = false;
              checkBuild = function() {
                return newLBObj.details(function(reply) {
                  if (reply.status === 'BUILD') {
                    return false;
                  } else if (reply.status === 'ACTIVE') {
                    rack.log('New LB built, id:', newLBObj.id);
                    originalLB["delete"](function() {
                      var checkDelete, checkOldLbDelete, resetPort, setSSL;
                      checkOldLbDelete = false;
                      checkDelete = function() {
                        return originalLB.details(function(reply) {
                          if (reply.status === 'PENDING_DELETE') {
                            return false;
                          } else if (reply.status === 'DELETED') {
                            rack.log('Original LB', originalLB.id, 'deleted');
                            setSSL();
                          } else {
                            rack.logerror('Some other status encountered:', reply);
                          }
                          return clearInterval(checkOldLbDelete);
                        });
                      };
                      checkOldLbDelete = setInterval(checkDelete, 5000);
                      setSSL = function() {
                        if (oldSSL != null) {
                          return newLBObj.setSSL(oldSSL, function(SSLreply) {
                            return resetPort();
                          });
                        } else {
                          return resetPort();
                        }
                      };
                      return resetPort = function() {
                        return newLBObj.update({
                          port: oldLB.port
                        }, function() {
                          rack.log('The load balancer has been rebuilt!');
                          rack.log('it will have almost certainly stayed in the same instance');
                          rack.log('so this was rather pointless' + "\n\n\n");
                          return rack.log('but I had fun!');
                        });
                      };
                    });
                  } else {
                    rack.logerror('Some other unexpected build status occured:', reply);
                    rack.logerror('the original load balancer was not deleted.');
                  }
                  return clearInterval(checkNewLBBuild);
                });
              };
              return checkNewLBBuild = setInterval(checkBuild, 10000);
            });
          });
        });
      },
      exportImageToAcct: function(imageUUID, target) {
        return true;
      },
      setServerStatusActive: function(serverUUID) {
        return true;
      }
    };
  };

}).call(this);
