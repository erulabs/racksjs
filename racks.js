/*jslint nomen: true*/
// Racks.js - a javascript SDK for the Rackspace Cloud - https://github.com/erulabs/racksjs
// by Seandon Mooy with contributions by Matt Ellsworth
(function () {
    "use strict";
    var RacksJS = (function () {
        var http = require('https');
        function RacksJS(authObject, raxReadyCallback) {
            var _racks = this;
            // Fail if not called with an authObject ({ username: 'foo', apikey: 'bar' ... })
            if (authObject === undefined) {
                console.log('No authentication object provided');
                return false;
            }
            // Set default verbosity (we default to nothing - only returning errors to the user's callbacks)
            // 0 = no logging, 1 = log requests only, 2 = log replies only,
            // 3 = log all replies and requests, 5 = debugmode/sysadmin mode (console friendly output)
            _racks.verbosity = (authObject.verbosity !== undefined) ? authObject.verbosity : 0;
            // Build out auth object - this was you can always easily test against RacksJS.authAccess.token.id
            _racks.authAccess = {
                token: {
                    id: false
                }
            };
            // Authenticate - if things go OK, we build buildProductCatalog()
            // either way, callback with a reference to ourselves
            _racks.authenticate(authObject, function (error) {
                if (error) {
                    _racks.error = error;
                } else {
                    _racks.error = false;
                    _racks.buildProductCatalog();
                }
                raxReadyCallback(_racks);
            });
        }
        // HTTP Request wrapper with defaults suitable for Rackspace API
        RacksJS.prototype.request = function (options, callback) {
            if (options.headers === undefined) {
                options.headers = {};
            }
            // If we are authenticated, pass the X-Auth-Token along
            if (this.authAccess.token.id) {
                options.headers["X-Auth-Token"] = this.authAccess.token.id;
            }
            // Set required headers - Always use JSON by default
            options.headers["Content-Type"] = "application/json";
            if (typeof options.data === "object") {
                options.data = JSON.stringify(options.data);
                options.headers["Content-Length"] = options.data.length;
            }
            // Logging nonsense
            if (this.verbosity === 1 || this.verbosity === 3) {
                console.log(options.method, options.url);
            } else if (this.verbosity === 5) {
                console.log('-> HTTP:', options, "\n==============================");
            }
            // interpret URL - TODO: improve this
            var _racks = this,
                urlParts = options.url.split('/'),
                urlHost = urlParts[2],
                urlPath,
                requestObject;
            urlParts.shift();
            urlParts.shift();
            urlParts.shift();
            urlPath = '/' + urlParts.join('/');
            options.path = urlPath;
            options.host = urlHost;
            // set some defaults for node's https
            options.port = 443;
            requestObject = http.request(options, function (reply) {
                reply.setEncoding('utf8');
                var replyBody = '',
                    parsedBody = false;
                reply.on('data', function (chunk) {
                    replyBody = replyBody + chunk;
                });
                reply.on('end', function () {
                    try {
                        parsedBody = JSON.parse(replyBody);
                    } catch (e) {
                        console.log('JSON parse error! Raw reply:', replyBody, 'exception:', e);
                    }
                    if (parsedBody) {
                        // Logging nonsense
                        if (_racks.verbosity === 2 || _racks.verbosity === 3) {
                            console.log(parsedBody);
                        } else if (_racks.verbosity === 5) {
                            console.log('<- REPLY:', parsedBody, "\n==============================");
                        }
                        callback(parsedBody);
                    }
                });
                reply.on('error', function (error) {
                    console.log('.request() for url:', options.host, options.path, 'error:', error);
                });
            });
            if (options.data !== undefined) {
                requestObject.write(options.data);
            }
            requestObject.end();
        };
        // Authentication via identity api v2.0 - writes out access to this.authAccess and callsback
        RacksJS.prototype.authenticate = function (authObjectRequest, callback) {
            var _racks = this;
            // TODO: validate presence on authObjectRequest options.
            _racks.request({
                method: 'POST',
                url: 'https://identity.api.rackspacecloud.com/v2.0/tokens',
                data: { 'auth': { 'RAX-KSKEY:apiKeyCredentials': {
                    'username': authObjectRequest.username,
                    'apiKey': authObjectRequest.apiKey
                } } }
            }, function (authObjectReply) {
                _racks.authAccess = authObjectReply.access;
                callback(false);
            });
        };
        // Take a raw response and wrap it to the product.model, if it exists
        RacksJS.prototype.model = function (product, resourceName, url, rawResources) {
            var _racks = this,
                resourceModel = false,
                singular = RacksJS.prototype.products[product.name][resourceName].singular,
                response = [];
            // assuming we have a model to map to
            if (_racks.products[product.name][resourceName].model !== undefined) {
                if (rawResources.forEach !== undefined) {
                    rawResources.forEach(function (rawResource) {
                        rawResource.target = url + '/' + rawResource.id;
                        resourceModel = new _racks.products[product.name][resourceName].model(_racks, product, rawResource);
                        resourceModel.product = product.name;
                        resourceModel.resource = resourceName;
                        response.push(resourceModel);
                    });
                } else {
                    // TODO: combine with the above
                    // TODO: Assuming .new() always lands here, need a smart way of showing build status.
                    // Perhaps .new() should be product specific.
                    if (rawResources[singular] !== undefined) {
                        rawResources = rawResources[singular];
                        rawResources.target = url + '/' + rawResources.id;
                        resourceModel = new _racks.products[product.name][resourceName].model(_racks, product, rawResources);
                        resourceModel.product = product.name;
                        resourceModel.resource = resourceName;
                        response = resourceModel;
                    } else {
                        console.log('.model() Unexpected reply for ', resourceName, '- not an array, nor matching singular "' + singular + '". Reply:', rawResources);
                        response = rawResources;
                    }
                }
            } else {
                response = rawResources;
            }
            return response;
        };
        // RESTful resource wrapper - uses product's endpoints and resource's uris to create common functions - all, where, etc.
        RacksJS.prototype.resource = function (product, resourceName, resource) {
            var _racks = this,
                resourceString = resourceName,
                url,
                resourceModel;
            if (resource.resourceString !== undefined) {
                resourceString = resource.resourceString;
            }
            // Build out singular noun for every resource
            if (resource.singular === undefined) {
                if (resourceName.substr(-1) === 's') {
                    resource.singular = resourceName.substr(0, resourceName.length - 1);
                } else {
                    console.log('.resource() error for', resourceName, ': failed to determine singular noun');
                }
            }
            url = product.target.publicURL + '/' + resourceString;
            // inconsistent behavior wrapping. For instance, cloud files doesn't reply with a noun at all.
            // cloudLoadBalancers.limits replies with "rates". loadBalancers only replies to /loadbalancers, etc.
            // for the LB issue, we allow a workaround here.
            // since "rates" have no actions, it's OK that we wont wrap them with a model
            // Essentially, since reply[resourceName] IS undefined, we simply pass the reply
            // since the reply is always an object, it won't be wrapped as a model
            // run rack.cloudLoadBalancers.limits.all for an example of this
            function interpretAPIResponse(reply) {
                if (reply[resourceName] !== undefined) {
                    reply = reply[resourceName];
                }
                return reply;
            }
            resource.all = function (callback) {
                _racks.request({
                    method: 'GET',
                    url: url
                }, function (reply) {
                    reply = interpretAPIResponse(reply);
                    callback(_racks.model(product, resourceName, url, reply));
                });
                //.fail(function (error) {
                //    console.log(resourceName, '.all() failure on', url, 'error:', error);
                //});
            };
            resource.find = function (uuid, callback) {
                _racks.request({
                    method: 'GET',
                    url: url + '/' + uuid
                }, function (reply) {
                    reply = interpretAPIResponse(reply);
                    callback(_racks.model(product, resourceName, url, reply));
                });
            };
            resource.where = function () {
            };
            resource.new = function (newObjData, callback) {
                // TODO: totally refactor .new() to be product specific. Not all resources have .new()
                if (resourceName === "servers") {
                    if (newObjData.flavorRef === undefined) {
                        return console.log(resourceName, '.new() - no flavorRef given - failing');
                    }
                    if (newObjData.name === undefined) {
                        return console.log(resourceName, '.new() - no name given - failing');
                    }
                    if (newObjData.imageRef === undefined) {
                        return console.log(resourceName, '.new() - no imageRef given - failing');
                    }
                    var data = { "server": newObjData };
                } else if (resourceName == "loadBalancers") {
                    if (newObjData.virtualIps === undefined) {
                        newObjData.virtualIps = [ { "type": "PUBLIC" }];
                    }
                    if (newObjData.protocol === undefined) {
                        newObjData.protocol = "HTTP";
                    }
                    var data = {
                        "loadBalancer": newObjData
                    }
                }
                _racks.request({
                    method: 'POST',
                    url: url,
                    data: data
                }, function (reply) {
                    reply = interpretAPIResponse(reply);
                    callback(_racks.model(product, resourceName, url, reply));
                });
            };
            return resource;
        };
        // Interpret the ServiceCatalog (from authenticate()) and bind our functionality
        // to easy-to-use objects according to product names and resources. For instance:
        // This function interprets authAccess.serviceCatalog, matching them against RacksJS.prototype.products
        // then binds RacksJS.PRODUCTNAME.RESOURCE.methods -> ie: RacksJS.cloudServersOpenStack.servers.all()
        // these functions return arrays containing the objects you'll find above in RacksJS.prototype.products ->
        // this is where all the Rackspace functionality lives - ie:
        // RacksJS.cloudServersOpenStack.servers.all(function (servers) {
        //   servers.forEach(function (server) {
        //     server.shutdown();
        //   })
        // });
        // with the exception of creation - ie: RacksJS.cloudServersOpenStack.servers.new()
        RacksJS.prototype.buildProductCatalog = function () {
            var _racks = this;
            // Todo: There ought to be a better way of doing this
            RacksJS.prototype._racks = _racks;
            // for each product in the service catalog
            this.authAccess.serviceCatalog.forEach(function (rawProduct) {
                var resourceName;
                // if we have a matching product defintion
                if (_racks.products[rawProduct.name] !== undefined) {
                    _racks[rawProduct.name] = {
                        endpoints: rawProduct.endpoints,
                        name: rawProduct.name,
                        target: false,
                        selectEndpoint: function (targetDC) {
                            if (this.endpoints !== undefined) {
                                if (this.endpoints.length > 1) {
                                    this.endpoints.forEach(function (endpoint) {
                                        if (endpoint.region === targetDC) {
                                            _racks[rawProduct.name].target = endpoint;
                                            RacksJS.prototype.products[rawProduct.name].target = endpoint;
                                        }
                                    });
                                } else {
                                    // Support for first-gen servers (products without an endpoint portfolio)
                                    this.target = this.endpoints[0];
                                }
                            }
                        }
                    };
                    // select default region to start
                    _racks[rawProduct.name].selectEndpoint(_racks.authAccess.user['RAX-AUTH:defaultRegion']);
                    // bind the resource functions to each resource listed within the product.
                    for (resourceName in _racks.products[rawProduct.name]) {
                        if (_racks.products[rawProduct.name].hasOwnProperty(resourceName)) {
                            if (resourceName !== "target") {
                                _racks[rawProduct.name][resourceName] = _racks.resource(_racks[rawProduct.name], resourceName, _racks.products[rawProduct.name][resourceName]);
                            }
                        }
                    }
                }
            });
        };
        // Product catalog and mapping
        RacksJS.prototype.products = {
            // Products
            'cloudServersOpenStack': {
                // Resources
                'servers': {
                    model: function (_racks, product, resource) {
                        // Resource level functionality
                        /* get server details - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Get_Server_Details-d1e2623.html
                        .details(function (serverDetails) {})
                        */
                        resource.details = function (callback) {
                            _racks.request({
                                method: 'GET',
                                url: resource.target
                            }, function (reply) {
                                callback(reply.server);
                            });
                        };
                        /* get server addresses - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ServerAddresses.html
                        .addresses('networklabel', function (serverAddresses) {})
                        .addresses(function (serverAddresses) {})
                        */
                        resource.addresses = function (first, second) {
                            // Sort arguments
                            var networkLabel = false,
                                callback,
                                url = resource.links[0].href + '/ips';
                            if (arguments.length === 1) {
                                callback = first;
                            } else if (arguments.length === 2) {
                                networkLabel = first;
                                callback = second;
                            } else {
                                console.log('.addresses() No callback provided - no output from this request is possible! Skipping.');
                                return false;
                            }
                            if (networkLabel) {
                                url = url + '/' + networkLabel;
                            }
                            _racks.request({
                                method: 'GET',
                                url: url
                            }, function (reply) {
                                // standarize reply between networkLabel / all
                                if (typeof reply.addresses === "object") {
                                    reply = reply.addresses;
                                }
                                callback(reply);
                            });
                        };
                        /* delete server - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Delete_Server-d1e2883.html
                        .delete(function (success, errorMessage) {})
                        if success == false, errorMessage is provided
                        */
                        resource.delete = function (callback) {
                            _racks.request({
                                method: 'DELETE',
                                url: resource.links[0].href
                            }, function (reply) {
                                callback(true);
                            });
                        };
                        /* general action wrapper - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Server_Actions-d1e3229.html
                        */
                        resource.action = function (actionObject, callback) {
                            if (typeof callback === "undefined") {
                                callback = function () {};
                            }
                            _racks.request({
                                method: 'POST',
                                url: resource.links[0].href + '/action',
                                data: actionObject
                            }, function (reply) {
                                callback(reply);
                            });
                        };
                        //The following are simply shortcuts for the .action() method.
                        resource.changePassword = function (newPassword, callback) {
                            resource.action({ "changePassword": {
                                "adminPass": newPassword
                            }   }, callback);
                        };
                        resource.reboot = function (first, second) {
                            var type = 'SOFT',
                                callback = function () {};
                            if (arguments.length === 1) {
                                callback = first;
                            } else if (arguments.length === 2) {
                                type = first;
                                callback = second;
                            }
                            resource.action({ "reboot": {
                                "type": type
                            }   }, callback);
                        };
                        resource.rebuild = function () {

                        };
                        resource.resize = function () {

                        };
                        resource.confirmResize = function () {

                        };
                        resource.revertResize = function () {

                        };
                        resource.rescue = function () {

                        };
                        resource.unrescue = function () {

                        };
                        resource.createImage = function (imageRequest, callback) {
                            var imageRequestObj;
                            if (typeof imageRequest === "string") {
                                imageRequestObj = {
                                    "name": imageRequest
                                };
                            } else {
                                imageRequestObj = imageRequest;
                            }
                            resource.action({ "createImage": imageRequestObj }, callback);
                        };
                        //http://docs.rackspace.com/servers/api/v2/cs-devguide/content/MetadataSection.html
                        resource.metadata = function () {

                        };
                        return resource;
                    }
                },
                'images': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'flavors': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudLoadBalancers': {
                'loadBalancers': {
                    // Sometimes we have to remap the name as it comes back from the API - this is a slightly odd edge case
                    // service catalog is "loadBalancer", api only responds to "loadbalancer".
                    resourceString: 'loadbalancers',
                    model: function (_racks, product, resource) {
                        resource.listNodes = function (callback) {
                            _racks.request({
                                method: 'GET',
                                url: resource.target + '/nodes'
                            }, function (reply) {
                                callback(reply.nodes);
                            });
                        };
                        resource.addNode = function (newNodes, callback) {
                            // Todo: add error checking here
                            _racks.request({
                                method: 'POST',
                                url: resource.target + '/nodes',
                                data: {
                                    "nodes": newNodes
                                }
                            }, function (reply) {
                                callback(reply);
                            });
                        };
                        resource.listVirtualIPs = function (callback) {
                            _racks.request({
                                method: 'GET',
                                url: resource.target + '/virtualips'
                            }, function (reply) {
                                callback(reply.virtualIps);
                            });
                        };
                        resource.vips = function (callback) {
                            resource.listVirtualIPs(callback);
                        };
                        return resource;
                    },
                    // Account level LB usage query
                    usage: function (callback) {
                        var product = RacksJS.prototype.products.cloudLoadBalancers,
                            url = product.target.publicURL,
                            // Get a reference to the instance -
                            // TODO: This is ugly, and shouldn't be nessisary
                            _racks = RacksJS.prototype._racks;
                        _racks.request({
                            method: 'GET',
                            // Todo: /loadbalancers/ ought to be prepended to our target automatically
                            // Its not, since this isn't a model level function
                            url: url + '/loadbalancers/usage'
                        }, function (reply) {
                            callback(reply);
                        });
                    }
                },
                // Sometimes there is no functionality associated with a reply.
                // In that case, we define the resource so that we can do limits.all, but not the model
                'limits': {}
            },
            'cloudFiles': {
                'containers': {
                    resourceString: '', // cloud files has no resource name - just uses the base product url.
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudFilesCDN': {
                'containers': {
                    resourceString: '',
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudBlockStorage': {
                'volumes': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'types': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'snapshots': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudDatabases': {
                'instances': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'flavors': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'backups': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            // TODO: Rackspace autoscale. This might be a case where the product
            // has _no_ .model(), -just- group level functions a deep and thorough knowledge of autoscale is required to proceed here
            // We'll leave it out for now to avoid confusion
            //'autoscale': {
            //},
            'cloudServers': {
                'servers': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'flavors': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'images': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudDNS': {
                'domains': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                },
                'limits': {
                    model: function (_racks, product, resource) {
                        return resource;
                    }
                }
            },
            'cloudMonitoring': {
            },
            'cloudBackup': {
            }
        };
        return RacksJS;
    }());
    // forEach Shim -
    // developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fn, scope) {
            var i, len;
            for (i = 0, len = this.length; i < len; i += 1) {
                if (this.hasOwnProperty[i]) {
                    fn.call(scope, this[i], i, this);
                }
            }
        };
    }
    module.exports = RacksJS;
}());