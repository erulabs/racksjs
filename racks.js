/*jshint loopfunc: true*/
// Racks.js - a javascript SDK for the Rackspace Cloud - https://github.com/erulabs/racksjs
(function () {
    "use strict";
    // Import NodeJS standard libs for HTTPS and URL parsing
    var https = require('https'),
        url = require('url');
    function RacksJS(authObject, cb) {
        // Pass empty auth object through, so that using poor syntax still throws an auth error reply
        this.authObject = (authObject === undefined) ? {} : authObject;
        // Set default verbosity to 0 unless otherwise defined
        this.verbosity = (this.authObject.verbosity === undefined) ? 0 : this.authObject.verbosity;
        // Set default identity endpoint to Rackspace Public Cloud
        this.authObject.endpoint = (this.authObject.endpoint === undefined) ? 'https://identity.api.rackspacecloud.com/v2.0' : this.authObject.endpoint;
        // We will store the authToken here when authenticated. 'false' meaning no valid auth yet.
        this.authToken = false;
        // If auth info was passed into the constructor, auth right away.
        if (this.authObject.username !== undefined && this.authObject.apiKey !== undefined) {
            this.authenticate(this.authObject, cb);
        }
    }
    // Logger to handle verbosity settings
    RacksJS.prototype.log = function (message, verbose) {
        if (this.verbosity === 1) {
            console.log(message);
        } else if (this.verbosity > 1) {
            console.log(message, verbose);
        }
    };
    // Handle HTTP requests. Generally same syntax as node's https.request
    // with a handful of helpful added defaults, such as JSON preference, parsing chunked replies, passing authToken, etc.
    RacksJS.prototype.https = function (opts, cb) {
        var plaintext = opts.plaintext;
        // Set headers and defaults
        opts.headers = (opts.headers === undefined) ? {} : opts.headers;
        if (this.authToken) {
            opts.headers['X-Auth-Token'] = this.authToken;
        }
        opts.headers['Content-Type'] = 'application/json';
        if (opts.data !== undefined) {
            opts.data = (typeof opts.data === 'object') ? JSON.stringify(opts.data) : opts.data;
            opts.headers['Content-Length'] = opts.data.length;
        }
        opts.url = url.parse(opts.url);
        opts.host = opts.url.host;
        opts.path = opts.url.path;
        delete opts.url;
        delete opts.plaintext;
        if (this.verbosity > 3) {
            this.log('HTTP Request: ', opts);
        }
        // HTTPS request
        var rack = this,
            request = https.request(opts, function (response) {
                var rawReply = '',
                    reply = '';
                response.setEncoding('utf8');
                // Collect chunked reply
                response.on('data', function (responseChunk) {
                    rawReply = rawReply + responseChunk;
                });
                response.on('end', function () {
                    // If JSON parsing fails, just pass back the raw reply.
                    if (plaintext === undefined) {
                        try {
                            reply = JSON.parse(rawReply);
                        } catch (e) {
                            reply = rawReply;
                        }
                    } else {
                        if (rawReply === "") {
                            reply = [];
                        } else {
                            reply = rawReply.substr(0, rawReply.length-1).split("\n");
                        }
                    }
                    if (rack.verbosity > 4) {
                        rack.log('HTTP Reply:', reply);
                    }
                    cb(reply);
                });
                response.on('error', function (error) {
                    rack.log(error, opts);
                });
            });
        // If we have any sort of data (POST), write it to the request.
        if (opts.data !== undefined) {
            request.write(opts.data);
        }
        request.end();
    };
    // Shortcut for HTTP GET
    RacksJS.prototype.get = function (url, cb) {
        this.https({
            method: 'GET',
            url: url
        }, cb);
    };
    // Shortcut for HTTP POST
    RacksJS.prototype.post = function (url, data, cb) {
        this.https({
            method: 'POST',
            url: url,
            data: data
        }, cb);
    };
    // Shortcut for HTTP DELETE
    RacksJS.prototype.delete = function (url, cb) {
        this.https({
            method: 'DELETE',
            url: url
        }, cb);
    };
    // Rackspace API Authentication
    RacksJS.prototype.authenticate = function (authObject, cb) {
        var rack = this;
        if (authObject.username === undefined || authObject.apiKey === undefined) {
            cb({ error: 'No username or apiKey provided to .authenticate()' });
            return false;
        }
        this.https({
            method: 'POST',
            url: authObject.endpoint + '/tokens',
            data: { 'auth': { 'RAX-KSKEY:apiKeyCredentials': {
                'username': authObject.username,
                'apiKey': authObject.apiKey
            } } }
        }, function (response) {
            if (response.access === undefined) {
                rack.log('Auth failed', response);
                rack.error = 'Auth failed';
            } else {
                rack.authToken = response.access.token.id;
                rack.access = response.access;
                rack.error = false;
                rack.buildCatalog(response.access.serviceCatalog);
            }
            cb(rack);
        });
    };
    // RacksJS product and resource functionality library
    // Interpert the serviceCatalog returned by .authenticate(). Wrap .all(), .where(), etc.
    RacksJS.prototype.buildCatalog = function (serviceCatalog) {
        var rack = this;
        rack.cloudServersOpenStack = {
            servers: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    catalog.addresses = function (cb) {
                        rack.get(this.meta.target() + '/ips', cb);
                    };
                    catalog.delete = function (cb) {
                        rack.delete(this.meta.target(), cb);
                    };
                    catalog.action = function (obj, cb) {
                        rack.post(this.meta.target() + '/action', obj, cb);
                    };
                    catalog.reboot = function (type, cb) {
                        if (typeof type === 'function') {
                            cb = type,
                            type = 'SOFT';
                        }
                        if (type !== 'SOFT' && type !== 'HARD') {
                            type = 'SOFT';
                        }
                        catalog.action({ reboot: {
                            type: type
                        }}, cb);
                    };
                    catalog.updateMetadata = function (metadata, cb) {
                        rack.post(this.meta.target() + '/metadata', {
                            metadata: metadata
                        }, cb);
                    };
                    catalog.listMetadata = function (cb) {
                        rack.get(this.meta.target() + '/metadata', cb);
                    };
                    return catalog;
                },
                new: function () {

                }
            }
        };
        // Expose some shortcuts for easier scripting
        rack.servers = rack.cloudServersOpenStack.servers;
        rack.cloudLoadBalancers = {
            loadBalancers: {
                meta: {
                    resourceString: 'loadbalancers',
                },
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(catalog.target(), cb);
                    };
                    return catalog;
                },
                new: function () {

                }
            }
        };
        rack.clbs = rack.cloudLoadBalancers.loadBalancers;
        rack.cloudFilesCDN = {
            
        };
        rack.cloudFiles = {
            containers: {
                meta: {
                    resourceString: '',
                    plaintext: true,
                },
                model: function (containerName) {
                    var catalog = {
                        id: containerName
                    };
                    catalog.listObjects = function (cb) {
                        rack.https({
                            method: 'GET',
                            plaintext: true,
                            url: this.meta.target()
                        }, cb);
                    };
                    return catalog;
                },
                new: function () {

                }
            }
        };
        rack.cf = rack.cloudFiles.containers;
        rack.autoscale = {
            
        };
        rack.cloudBlockStorage = {
            
        };
        rack.cloudDatabases = {
            
        };
        rack.cloudOrchestration = {
            
        };
        rack.cloudQueues = {
            
        };
        rack.cloudBackup = {
            
        };
        rack.cloudImages = {
            
        };
        rack.cloudServers = {
            
        };
        rack.cloudDNS = {
            
        };
        rack.cloudMonitoring = {
            
        };
        rack.products = {};
        rack.serviceCatalog = serviceCatalog;
        function buildModel(resourceTemplate, rawResource) {
            var model = resourceTemplate.model(rawResource);
            model.meta = {
                resource: resourceTemplate.meta.name,
                product: resourceTemplate.meta.product
            };
            model.meta.target = function () {
                var target = resourceTemplate.meta.target();
                if (target.substr(-1) === '/') {
                    target = target.substr(0, target.length-1);
                }
                return target + '/' + model.id;
            };
            return model;
        }
        serviceCatalog.forEach(function (product) {
            var resourceName;
            // If we have a matching product
            if (rack[product.name] !== undefined) {
                rack[product.name].meta = {
                    endpoints: product.endpoints,
                    target: function () {
                        var dc = (rack.datacenter === undefined) ? rack.access.user['RAX-AUTH:defaultRegion'] : rack.datacenter,
                            target;
                        if (this.endpoints.length > 1) {
                            this.endpoints.forEach(function (endpoint) {
                                if (endpoint.region === dc) {
                                    target = endpoint.publicURL;
                                }
                            });
                        } else {
                            // First gen servers which do not have a normal endpoint catalog
                            target = this.endpoints[0];
                        }
                        if (target.substr(-1) !== '/') {
                            target = target + '/';
                        }
                        return target;
                    }
                };
                rack.products[product.name] = {};
                for (resourceName in rack[product.name]) {
                    if (rack[product.name].hasOwnProperty(resourceName)) {
                        // the "meta" property of any given product is not a resource and should be ignored
                        if (resourceName !== 'meta') {
                            rack.products[product.name][resourceName] = rack[product.name][resourceName];
                            // Build this products .meta()
                            if (rack[product.name][resourceName].meta === undefined) {
                                rack[product.name][resourceName].meta = {};
                            }
                            rack[product.name][resourceName].meta.name = resourceName;
                            rack[product.name][resourceName].meta.product = product.name;
                            // Call our parent products .target() function and append our resource name
                            rack[product.name][resourceName].meta.target = function () {
                                var resourcePath = (this.resourceString === undefined) ? this.name : this.resourceString;
                                return rack[this.product].meta.target() + resourcePath;
                            };
                            // Get all resources, bind reply into resources.model() (if there is one), and callback
                            rack[product.name][resourceName].all = function (cb) {
                                var resource = this;
                                rack.https({
                                    plaintext: resource.meta.plaintext,
                                    method: 'GET',
                                    url: this.meta.target()
                                }, function (reply) {
                                    var response = [];
                                    if (reply[resource.meta.name] !== undefined) {
                                        if (resource.model === undefined) {
                                            cb(reply[resource.meta.name]);
                                        } else {
                                            reply[resource.meta.name].forEach(function (raw) {
                                                response.push(buildModel(resource, raw));
                                            });
                                            cb(response);
                                        }
                                    } else {
                                        if (resource.meta.plaintext !== undefined) {
                                            // If we're expecting a plaintext reply, as is the case with cloudFiles,
                                            // then strip the trailing newline (substr), and split into an array, then return
                                            //cb(reply.substr(0, reply.length-1).split("\n"));
                                            // This is now down in .https()
                                            reply.forEach(function (raw) {
                                                response.push(buildModel(resource, raw));
                                            });
                                            cb(response);
                                        } else {
                                            console.log('product wrapping failure -', resource.meta.name, 'raw reply:', reply);
                                        }
                                    }
                                });
                            };
                            //racks[product.name][resourceName].where = function () {
                            //
                            //};
                            //racks[product.name][resourceName].find = function () {
                            //
                            //};
                        }
                    }
                }
            } else {
                rack.log('no product named "' + product.name + '" found in racksjs - please contact the maintainers');
            }
        });
    };
    module.exports = RacksJS;
}());