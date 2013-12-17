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
                    try {
                        reply = JSON.parse(rawReply);
                    } catch (e) {
                        reply = rawReply;
                    } finally {
                        if (rack.verbosity > 4) {
                            rack.log('HTTP Reply:', reply);
                        }
                        cb(reply);
                    }
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
                rack.user = response.access.user;
                rack.error = false;
                rack.buildCatalog(response.access.serviceCatalog);
            }
            cb(rack);
        });
    };
    // Interpret API response for group level functions - correlates the response to the appropriate product.
    //   if a product is found, attach functionality - if a product.model is found, call
    //   product.model(this) -> in this way group functionality is added to the product, (servers.all())
    //   and instance level functionality is added to the response (servers.all() -> servers.each -> server.reboot(), etc)
    RacksJS.prototype.wrapResource = function (product, resource) {
        var rack = this;
    };
    // RacksJS product and resource functionality library
    // Interpert the serviceCatalog returned by .authenticate(). Wrap .all(), .where(), etc.
    RacksJS.prototype.buildCatalog = function (serviceCatalog) {
        var rack = this;
        rack.cloudServersOpenStack = {
            servers: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(catalog.target, cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cloudLoadBalancers = {
            loadBalancers: {
                meta: {
                    resourceString: 'loadbalancers',
                },
                model: function (catalog) {
                    return catalog;
                }
            }
        };
        serviceCatalog.forEach(function (product) {
            var resourceName;
            if (rack[product.name] !== undefined) {
                rack[product.name].meta = {
                    endpoints: product.endpoints,
                    target: function () {
                        var dc = (rack.datacenter === undefined) ? rack.user['RAX-AUTH:defaultRegion'] : rack.datacenter,
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
                        return target;
                    }
                };
                for (resourceName in rack[product.name]) {
                    if (rack[product.name].hasOwnProperty(resourceName)) {
                        // the "meta" property of any given product is not a resource and should be ignored
                        if (resourceName !== 'meta') {
                            // Bind references to the product and resource 
                            if (rack[product.name][resourceName].meta === undefined) {
                                rack[product.name][resourceName].meta = {};
                            }
                            rack[product.name][resourceName].meta.name = resourceName;
                            rack[product.name][resourceName].meta.product = product.name;
                            // Call our parent products .target() function and append our resource name
                            rack[product.name][resourceName].meta.target = function () {
                                var resourcePath = (this.resourceString === undefined) ? this.name : this.resourceString;
                                return rack[this.product].meta.target() + '/' + resourcePath;
                            };
                            // Get all resources, bind reply into resources.model() (if there is one), and callback
                            rack[product.name][resourceName].all = function (cb) {
                                var resource = this;
                                rack.get(this.meta.target(), function (reply) {
                                    if (reply[resource.meta.name] !== undefined) {
                                        cb(reply[resource.meta.name]);
                                    } else {
                                        console.log('product wrapping failure -', resource.meta.name, 'raw reply:', reply);
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
            };
        });
    };
    module.exports = RacksJS;
}());