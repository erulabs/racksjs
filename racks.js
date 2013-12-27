/*jshint loopfunc: true*/
// Racks.js - a javascript SDK for the Rackspace Cloud - https://github.com/erulabs/racksjs
(function () {
    "use strict";
    // Import NodeJS standard libs for HTTPS and URL parsing
    var https = require('https'),
        url = require('url'),
        fs = require('fs');
    function RacksJS(authObject, cb) {
        // Pass empty auth object through, so that using poor syntax still throws an auth error reply
        this.authObject = (authObject === undefined) ? {} : authObject;
        // Set default verbosity to 0 unless otherwise defined
        this.verbosity = (this.authObject.verbosity === undefined) ? 0 : this.authObject.verbosity;
        // Set default identity endpoint to Rackspace Public Cloud
        this.authObject.endpoint = (this.authObject.endpoint === undefined) ? 'https://identity.api.rackspacecloud.com/v2.0' : this.authObject.endpoint;
        // We will store the authToken here when authenticated. 'false' meaning no valid auth yet.
        this.authToken = false;
        // Cache common tasks like authentication - don't by default.
        this.cache = (this.authObject.cache === undefined) ? false : this.authObject.cache;
        if (this.cache) {
            this.cache = (typeof this.cache !== 'string') ? '.racksjs' : this.cache;
        }
        // If auth info was passed into the constructor, auth right away.
        if (this.authObject.username !== undefined && this.authObject.apiKey !== undefined) {
            this.authenticate(this.authObject, cb);
        }
    }
    // Logger to handle verbosity settings
    RacksJS.prototype.log = function (message, verbose) {
        if (this.verbosity === 1) {
            if (message !== undefined) {
                console.log(message);
            }
        } else if (this.verbosity > 1) {
            if (message === undefined) {
                message = '[DEBUG] ';
            }
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
        // HTTPS request
        var rack = this,
            plaintext = opts.plaintext,
            request;
        delete opts.plaintext;
        delete opts.url;
        if (this.verbosity > 3) {
            this.log('HTTP Request: ', opts);
        }
        request = https.request(opts, function (response) {
            var rawReply = '',
                reply = '';
            response.setEncoding('utf8');
            // Collect chunked reply
            response.on('data', function (responseChunk) {
                rawReply = rawReply + responseChunk;
            });
            response.on('end', function () {
                if (plaintext === undefined) {
                    try {
                        reply = JSON.parse(rawReply);
                    } catch (e) {
                        // If JSON parsing fails, just pass back the raw reply.
                        reply = rawReply;
                    }
                } else {
                    // If we're expecting plaintext, as is the case with cloudfiles, then parse
                    // the silly plaintext response.
                    if (rawReply.length === 0) {
                        reply = [];
                    } else {
                        reply = rawReply.substr(0, rawReply.length - 1).split("\n");
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
        delete opts.plaintext;
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
    // Shortcut for HTTP PUT
    RacksJS.prototype.put = function (url, cb) {
        this.https({
            method: 'PUT',
            url: url
        }, cb);
    };
    // RackJS cache
    RacksJS.prototype.getCache = function (cb) {
        var rack = this;
        if (this.cacheData === undefined) {
            fs.exists(rack.cache, function (exists) {
                if (exists) {
                    fs.readFile(rack.cache, function (err, cacheFile) {
                        if (err) {
                            rack.log('[INFO] getCache() error:', err);
                            rack.cacheData = {};
                        } else {
                            rack.cacheData = JSON.parse(cacheFile);
                        }
                        cb();
                    });
                } else {
                    rack.cacheData = {};
                    cb();
                }
            });
        }
    };
    // Rackjs saveCache
    RacksJS.prototype.saveCache = function (cb) {
        var rack = this,
            cacheJson = JSON.stringify(rack.cacheData);
        fs.writeFile(rack.cache, cacheJson, function (err) {
            if (err) {
                rack.log('[INFO] saveCache() error:', err);
            } else {
                if (cb !== undefined) {
                    cb();
                }
            }
        });
    };
    // Rackspace API Authentication
    RacksJS.prototype.authenticate = function (authObject, cb) {
        var rack = this,
            authAction;
        authAction = function () {
            rack.https({
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
                    if (rack.cache) {
                        rack.cacheData[rack.authObject.username] = {
                            access: rack.access
                        };
                        rack.saveCache();
                    }
                }
                cb(rack);
            });
        };

        if (authObject.username === undefined || authObject.apiKey === undefined) {
            cb({ error: 'No username or apiKey provided to .authenticate()' });
            return false;
        }
        if (rack.cache) {
            rack.getCache(function () {
                // make this based on a timer
                if (rack.cacheData[rack.authObject.username] === undefined) {
                    authAction();
                } else {
                    rack.authToken = rack.cacheData[rack.authObject.username].access.token.id;
                    rack.access = rack.cacheData[rack.authObject.username].access;

                    if (Date.parse(rack.access.token.expires) < (new Date().getTime() / 1000)) {
                        authAction();
                    } else {
                        rack.error = false;
                        rack.buildCatalog(rack.cacheData[rack.authObject.username].access.serviceCatalog);
                        cb(rack);
                    }
                }
            });
        } else {
            authAction();
        }
    };
    // buildModel - wraps each item in typical API response arrays. In other words, for a list of servers, each server (which is a {}),
    // gets appended with a bunch of functionality (whatever is in its .model()), some metadata which is nice for scripting
    // and most importantly, a target function
    RacksJS.prototype.buildModel = function (resourceTemplate, rawResource) {
        // Metadata
        var model = resourceTemplate.model(rawResource);
        if (model.meta === undefined) {
            model.meta = {};
        }
        model.meta.resource = resourceTemplate.meta.name;
        model.meta.product = resourceTemplate.meta.product;
        // meta.target() -> gets the resources target(), appends this models name or ID, and returns
        model.meta.target = function () {
            var target = resourceTemplate.meta.target(),
                idOrName = '';
            if (target.substr(-1) === '/') {
                target = target.substr(0, target.length - 1);
            }
            if (model.id !== undefined) {
                idOrName = model.id;
            } else if (model.name !== undefined) {
                idOrName = model.name;
            } else {
                idOrName = '';
            }
            return target + '/' + idOrName;
        };
        return model;
    };
    // Wrap resource requests (.all())
    RacksJS.prototype.resourceRequest = function (resource, cb) {
        var rack = this;
        rack.https({
            plaintext: resource.meta.plaintext,
            method: 'GET',
            url: resource.meta.target()
        }, function (reply) {
            var response = [];
            // Most good API resources reply this way: ie: get /servers (what we call servers.all())
            // respond with { servers: [ {}, {}, {} ... ] }
            // which is exactly what we want - all we do is strip the outer { servers: } object
            // and pass the array that was requested
            if (reply[resource.meta.name] !== undefined) {
                if (resource.model === undefined) {
                    cb(reply[resource.meta.name]);
                } else {
                    if (reply[resource.meta.name].forEach === undefined) {
                        cb(rack.buildModel(resource, reply[resource.meta.name]));
                    } else {
                        reply[resource.meta.name].forEach(function (raw) {
                            response.push(rack.buildModel(resource, raw));
                        });
                        cb(response);
                    }
                }
            // However, some API resources are lame :( and respond in plaintext
            // if so, we'll sort of build that model for them (ie: an array of the objects they requested)
            } else if (resource.meta.plaintext !== undefined) {
                reply.forEach(function (raw) {
                    response.push(rack.buildModel(resource, raw));
                });
                cb(response);
            // some resources are bad, and dont respond well to a GET at their /, or we didn't code around their weirdness yet
            // Typically, these are resources which legitimently shouldn't have .all(), like /getAccount in cloudMonitoring
            } else {
                rack.log(undefined, 'product wrapping failure - contact the developers of racksjs', resource.meta);
                cb(reply);
            }
        });
    };
    // A quick wrapper for defining a subresource -> still wraps buildResource, but provides a modified .target() with its parents id
    RacksJS.prototype.subResource = function (resource, id, subResource) {
        var rack = this;
        return rack.buildResource(resource.meta.product, resource.meta.name + '/' + subResource, {
            meta: {
                resourceString: subResource,
                name: subResource,
                target: function () {
                    return resource.meta.target() + '/' + id + '/' + subResource;
                }
            }
        });
    };
    // Build a RacksJS resource - essentially just add .meta and most importantly .meta.target()
    RacksJS.prototype.buildResource = function (productName, resourceName, subResource) {
        // Build this products .meta()
        var rack = this,
            resource = (subResource === undefined) ? rack[productName][resourceName] : subResource;
        if (resource.meta === undefined) {
            resource.meta = {};
        }
        resource.meta.name = (resource.meta.name === undefined) ? resourceName : resource.meta.name;
        resource.meta.product = productName;
        // Call our parent products .target() function and append our resource name
        if (resource.meta.target === undefined) {
            resource.meta.target = function () {
                var resourcePath = (resource.meta.resourceString === undefined) ? this.name : resource.meta.resourceString;
                return rack[productName].meta.target() + resourcePath;
            };
        }
        // Get all resources, bind reply into resources.model() (if there is one), and callback
        if (resource.meta.noResource === undefined) {
            resource.all = function (cb) {
                rack.resourceRequest(resource, cb);
            };
            // 
            resource.assume = function (obj, cb) {
                if (obj.id === undefined && obj.name === undefined) {
                    rack.log('[INFO] .assume() relies on .target() which in turn requires either .id or .name on the model - please define one or the other');
                } else {
                    cb(rack.buildModel(resource, obj));
                }
            };
        }
        return resource;
    };
    // RacksJS product and resource functionality library
    // Interpert the serviceCatalog returned by .authenticate(). Wrap .all(), .where(), etc.
    RacksJS.prototype.buildCatalog = function (serviceCatalog) {
        var rack = this;
        rack.cloudServersOpenStack = {
            networks: {
                meta: {
                    resourceString: 'os-networksv2'
                },
                model: function (catalog) {
                    catalog.show = function (cb) {
                        // Public and private networks do not reply to show() - they 404.
                        // however, the only thing .show() really does is give you a CIDR - therefore,
                        // instead of 404ing weirdly, we'll just reply back instantly without a CIDR
                        // since we have all other data anyways...
                        // Because this is odd, we'll log a message for development mode only
                        rack.log(undefined, 'You cannot run .show() on the default public and private networks! Instead, RacksJS has returned a fake object that is everything .show() is, save the CIDR - so you might want to check for reply.cidr === undefined');
                        if (catalog.label === 'public' || catalog.label === 'private') {
                            cb({
                                network: {
                                    id: catalog.id,
                                    label: catalog.label,
                                    cidr: undefined
                                }
                            });
                        } else {
                            rack.get(this.meta.target(), cb);
                        }
                    };
                    return catalog;
                }
            },
            flavors: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            },
            images: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            },
            servers: {
                meta: {
                    requiredFields: {
                        name: 'string',
                        imageRef: 'string', //might be rack.cloudServersOpenStack.images.model([]),
                        flavorRef: 'string' //might be rack.cloudServersOpenStack.flavors.model([])
                    }
                },
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
                            cb = type;
                            type = 'SOFT';
                        }
                        if (type !== 'SOFT' && type !== 'HARD') {
                            type = 'SOFT';
                        }
                        catalog.action({ reboot: {
                            type: type
                        }}, cb);
                    };
                    //catalog.updateMetadata = function (metadata, cb) {
                    //    rack.post(this.meta.target() + '/metadata', {
                    //        metadata: metadata
                    //    }, cb);
                    //};
                    //catalog.listMetadata = function (cb) {
                    //    rack.get(this.meta.target() + '/metadata', cb);
                    //};
                    catalog.metadata = catalog.records = rack.subResource(this, catalog.id, 'metadata');
                    catalog.listVirtualInterfaces = function (cb) {
                        rack.get(this.meta.target() + '/os-virtual-interfacesv2', cb);
                    };
                    catalog.vips = catalog.listVirtualInterfaces;
                    return catalog;
                },
                new: function (args, cb) {
                }
            }
        };
        // Expose some shortcuts for easier scripting
        rack.servers = rack.cloudServersOpenStack.servers;
        rack.networks = rack.cloudServersOpenStack.networks;
        rack.cloudLoadBalancers = {
            algorithms: {
                meta: {
                    resourceString: 'loadbalancers/algorithms'
                }
            },
            alloweddomains: {
                meta: {
                    resourceString: 'loadbalancers/alloweddomains',
                    name: 'allowedDomains'
                }
            },
            protocols: {
                meta: {
                    resourceString: 'loadbalancers/protocols'
                }
            },
            loadBalancers: {
                meta: {
                    resourceString: 'loadbalancers',
                },
                model: function (catalog) {
                    var resource = this;
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    catalog.listVirtualIPs = function (cb) {
                        rack.get(this.meta.target() + '/virtualips', cb);
                    };
                    catalog.usage = function (cb) {
                        rack.get(this.meta.target() + '/usage/current', cb);
                    };
                    catalog.sessionpersistence = {
                        list: function (cb) {
                            rack.get(resource.meta.target() + '/sessionpersistence', cb);
                        },
                        enable: function (cb) {
                            rack.put(resource.meta.target() + '/sessionpersistence', cb);
                        },
                        disable: function (cb) {
                            rack.delete(resource.meta.target() + '/sessionpersistence', cb);
                        }
                    };
                    catalog.connectionlogging = {
                        list: function (cb) {
                            rack.get(resource.meta.target() + '/connectionlogging', cb);
                        },
                        enable: function (cb) {
                            rack.put(resource.meta.target() + '/connectionlogging?enabled=true', cb);
                        },
                        disable: function (cb) {
                            rack.put(resource.meta.target() + '/connectionlogging?enabled=false', cb);
                        }
                    };
                    catalog.accesslist = {
                        list: function (cb) {
                            rack.get(resource.meta.target() + '/accesslist', cb);
                        }
                    };
                    catalog.nodes = rack.subResource(resource, catalog.id, 'nodes');
                    return catalog;
                },
                new: function () {
                    console.log('unimplimented');
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
                        meta: {
                            name: containerName
                        }
                    };
                    catalog.listObjects = function (cb) {
                        rack.https({
                            method: 'GET',
                            plaintext: true,
                            url: this.meta.target()
                        }, cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cf = rack.cloudFiles.containers;
        rack.autoscale = {
            groups: {
                model: function (catalog) {
                    catalog.getPolicies = function (cb) {
                        rack.get(this.meta.target() + '/policies', cb);
                    };
                    catalog.getConfigurations = function (cb) {
                        rack.get(this.meta.target() + '/config', cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cloudBlockStorage = {
            volumes: {
                model: function (catalog) {
                    catalog.show = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    catalog.rename = function (opts, cb) {
                        var queryString = '';
                        if (opts.name !== undefined) {
                            queryString = 'display_name=' + opts.name + '&';
                        }
                        if (opts.description !== undefined) {
                            queryString = 'display_description=' + opts.description;
                        }
                        if (queryString === '') {
                            rack.log('Pass either opts.name or opts.description');
                        } else {
                            rack.put(this.meta.target() + queryString, cb);
                        }
                    };
                    return catalog;
                }
            },
            types: {
                model: function (catalog) {
                    catalog.describe = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cbs = rack.cloudBlockStorage.volumes;
        rack.cloudDatabases = {
            instances: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    catalog.action = function (obj, cb) {
                        rack.post(this.meta.target() + '/action', obj, cb);
                    };
                    catalog.restart = function (cb) {
                        catalog.action({ restart: {} }, cb);
                    };
                    catalog.resize = function (flavorRef, cb) {
                        catalog.action({ resize: {
                            "flavorRef": flavorRef
                        }}, cb);
                    };
                    catalog.listDatabases = function (cb) {
                        rack.get(this.meta.target() + '/databases', cb);
                    };
                    catalog.listUsers = function (cb) {
                        rack.get(this.meta.target() + '/users', cb);
                    };
                    catalog.listFlavors = function (cb) {
                        rack.get(this.meta.target() + '/flavors', cb);
                    };
                    catalog.listBackups = function (cb) {
                        rack.get(this.meta.target() + '/backups', cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cloudOrchestration = {
        };
        rack.cloudQueues = {
            queues: {
                model: function (catalog) {
                    catalog.listMessages = function (cb) {
                        rack.get(this.meta.target() + '/claims', cb);
                    };
                    return catalog;
                }
            }
        };
        rack.cloudBackup = {
            configurations: {
                meta: {
                    noResource: true,
                    resourceString: 'backup-configuration'
                }
            },
            agents: {
                meta: {
                    noResource: true,
                    resourceString: 'user/agents'
                }
            }
        };
        rack.cloudImages = {
        };
        rack.cloudServers = {
        };
        rack.cloudDNS = {
            limits: function (cb) {
                rack.get(this.meta.target() + '/limits', function (catalog) {
                    catalog.types = function (cb) {
                        rack.get(this.meta.target() + '/types', cb);
                    };
                    cb(catalog);
                });
            },
            domains: {
                model: function (catalog) {
                    var resource = this;
                    catalog.details = function (cb) {
                        rack.get(resource.meta.target(), cb);
                    };
                    // Subresource example
                    catalog.records = rack.subResource(resource, catalog.id, 'records');
                    catalog.subdomains = rack.subResource(resource, catalog.id, 'subdomains');
                    return catalog;
                }
            },
            rdns: {
            }
        };
        rack.cloudMonitoring = {
            entities: {
                model: function (catalog) {
                    catalog.listChecks = function (cb) {
                        rack.get(this.meta.target() + '/checks', cb);
                    };
                    catalog.listAlarms = function (cb) {
                        rack.get(this.meta.target() + '/alarms', cb);
                    };
                    return catalog;
                }
            },
            limits: {
            },
            audits: {

            },
            checkTypes: {
                meta: {
                    resourceString: 'check_types'
                },
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            },
            monitoringZones: {
                meta: {
                    resourceString: 'monitoring_zones'
                },
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            },
            notifications: {
                model: function (catalog) {
                    catalog.details = function (cb) {
                        rack.get(this.meta.target(), cb);
                    };
                    return catalog;
                }
            },
            agents: {

            },
            //http://docs.rackspace.com/cm/api/v1.0/cm-devguide/content/service-views.html
            overview: function (cb) {
                //console.log(this.meta.target());
                rack.get(this.meta.target() + 'views/overview', cb);
            }
        };
        rack.products = {};
        rack.serviceCatalog = serviceCatalog;
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
                        if (typeof target === "object") {
                            target = target.publicURL;
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
                            rack[product.name][resourceName] = rack.buildResource(product.name, resourceName);
                            // alias it in .products
                            rack.products[product.name][resourceName] = rack[product.name][resourceName];
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