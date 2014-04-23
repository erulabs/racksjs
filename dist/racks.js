(function() {
  "use strict";
  var RacksJS;

  module.exports = RacksJS = (function() {
    function RacksJS(authObj, callback) {
      this.authObj = authObj;
      this.https_node = require('https');
      this.url = require('url');
      this.fs = require('fs');
      this.authToken = false;
      this.products = {};
      if (this.authObj == null) {
        this.authObj = {};
      }
      if (this.authObj.verbosity == null) {
        this.verbosity = 0;
      } else {
        this.verbosity = this.authObj.verbosity;
      }
      if (this.authObj.endpoint == null) {
        this.authObj.endpoint = 'https://identity.api.rackspacecloud.com/v2.0';
      }
      if (this.authObj.test == null) {
        this.test = false;
      } else {
        this.test = this.authObj.test;
      }
      this.clr = {
        red: "\u001b[31m",
        blue: "\u001b[34m",
        green: "\u001b[32m",
        cyan: "\u001b[36m",
        gray: "\u001b[1;30m",
        reset: "\u001b[0m"
      };
      this.buildProducts();
      if ((this.authObj.username != null) && (this.authObj.apiKey != null) && (callback != null)) {
        this.authenticate(this.authObj, callback);
      }
      this.network = 'public';
    }

    RacksJS.prototype.log = function(message, verbose) {
      var date;
      date = new Date();
      process.stdout.write(date.getMonth() + '/' + date.getDate() + ' ' + date.toTimeString().split(' ')[0] + ' ');
      return console.log.apply(this, arguments);
    };

    RacksJS.prototype.https = function(opts, callback) {
      var plaintext, request;
      if (opts.headers == null) {
        opts.headers = {};
      }
      plaintext = opts.plaintext;
      delete opts.plaintext;
      if (this.authToken) {
        opts.headers['X-Auth-Token'] = this.authToken;
      }
      opts.headers['Content-Type'] = 'application/json';
      if (opts.data != null) {
        if (typeof opts.data === 'object') {
          opts.data = JSON.stringify(opts.data);
        }
        opts.headers['Content-Length'] = opts.data.length;
      }
      opts.url = this.url.parse(opts.url);
      opts.host = opts.url.host;
      opts.path = opts.url.path;
      delete opts.url;
      if (this.verbosity === 1) {
        this.log(this.clr.cyan + opts.method + this.clr.reset + ':', opts.path);
      } else if (this.verbosity > 1) {
        this.log(this.clr.cyan + 'Request' + this.clr.reset + ':', opts);
      }
      if (this.test) {
        return this.mockApi(opts, callback);
      } else {
        request = this.https_node.request(opts, (function(_this) {
          return function(response) {
            var rawReply;
            rawReply = '';
            response.setEncoding('utf8');
            response.on('data', function(responseChunk) {
              return rawReply = rawReply + responseChunk;
            });
            response.on('end', function() {
              var error, reply;
              if (plaintext) {
                if (rawReply.length === 0) {
                  reply = [];
                } else {
                  reply = rawReply.substr(0, rawReply.length - 1).split("\n");
                }
              } else {
                try {
                  reply = JSON.parse(rawReply);
                } catch (_error) {
                  error = _error;
                  reply = rawReply;
                }
              }
              if (_this.verbosity === 1) {
                _this.log(_this.clr.cyan + 'Reply' + _this.clr.reset + ':', response.statusCode);
              } else if (_this.verbosity > 3) {
                _this.log(_this.clr.cyan + 'Reply' + _this.clr.reset + ':', reply);
              }
              return callback(reply);
            });
            return response.on('error', function(error) {
              return _this.log(error, opts);
            });
          };
        })(this));
        if (opts.data != null) {
          request.write(opts.data);
        }
        return request.end();
      }
    };

    RacksJS.prototype.get = function(url, callback) {
      return this.https({
        method: 'GET',
        url: url
      }, callback);
    };

    RacksJS.prototype.post = function(url, data, callback) {
      return this.https({
        method: 'POST',
        url: url,
        data: data
      }, callback);
    };

    RacksJS.prototype["delete"] = function(url, callback) {
      return this.https({
        method: 'DELETE',
        url: url
      }, callback);
    };

    RacksJS.prototype.put = function(url, data, callback) {
      return this.https({
        method: 'PUT',
        url: url,
        data: data
      }, callback);
    };

    RacksJS.prototype.authenticate = function(authObj, callback) {
      if ((authObj.username == null) || (authObj.apiKey == null)) {
        return callback({
          error: 'No username or apiKey provided to .authenticate()'
        });
      }
      return this.post(authObj.endpoint + '/tokens', {
        'auth': {
          'RAX-KSKEY:apiKeyCredentials': {
            'username': authObj.username,
            'apiKey': authObj.apiKey
          }
        }
      }, (function(_this) {
        return function(response) {
          if (response.access != null) {
            _this.authToken = response.access.token.id;
            _this.access = response.access;
            _this.error = false;
            _this.serviceCatalog = response.access.serviceCatalog;
            _this.buildCatalog(_this.serviceCatalog);
          } else {
            _this.log('Auth failed', response);
            _this.error = 'Auth failed';
          }
          return callback(_this);
        };
      })(this));
    };

    RacksJS.prototype.buildModel = function(template, raw) {
      var model, rack;
      rack = this;
      if (template.model != null) {
        model = template.model(raw);
      } else {
        return raw;
      }
      model._racksmeta = {
        resource: template._racksmeta.name,
        product: template._racksmeta.product,
        target: (function(_this) {
          return function() {
            var idOrName, target;
            target = template._racksmeta.target();
            idOrName = '';
            if (target.substr(-1) === '/') {
              target = target.substr(0, target.length - 1);
            }
            if (model.id != null) {
              idOrName = model.id;
            } else if (model.name != null) {
              idOrName = model.name;
            }
            return target + '/' + idOrName;
          };
        })(this)
      };
      return model;
    };

    RacksJS.prototype.resourceRequest = function(resource, callback) {
      return this.https({
        url: resource._racksmeta.target(),
        plaintext: resource._racksmeta.plaintext,
        method: 'GET'
      }, (function(_this) {
        return function(reply) {
          var metaName, response;
          metaName = resource._racksmeta.name;
          if (resource._racksmeta.replyString != null) {
            metaName = resource._racksmeta.replyString;
          }
          if (reply[metaName] != null) {
            if (resource.model) {
              if (reply[metaName].push != null) {
                response = [];
                reply[metaName].forEach(function(raw) {
                  return response.push(_this.buildModel(resource, raw));
                });
                return callback(response);
              } else {
                return callback(_this.buildModel(resource, reply[metaName]));
              }
            } else {
              return callback(reply[metaName]);
            }
          } else if (resource._racksmeta.plaintext != null) {
            response = [];
            reply.forEach(function(raw) {
              return response.push(_this.buildModel(resource, raw));
            });
            return callback(response);
          } else {
            _this.log(void 0, 'product wrapping failure - contact the developers of racksjs', resource.meta);
            return callback(reply);
          }
        };
      })(this));
    };

    RacksJS.prototype.subResource = function(resource, id, subResource) {
      return this.buildResource(resource._racksmeta.product, resource._racksmeta.name + '/' + subResource, {
        _racksmeta: {
          resourceString: subResource,
          name: subResource,
          target: (function(_this) {
            return function() {
              return resource._racksmeta.target() + '/' + id + '/' + subResource;
            };
          })(this)
        }
      });
    };

    RacksJS.prototype.buildResource = function(productName, resourceName, subResource) {
      var rack, resource;
      if (subResource != null) {
        resource = subResource;
      } else {
        resource = this[productName][resourceName];
      }
      if (resource._racksmeta == null) {
        resource._racksmeta = {};
      }
      if (resource._racksmeta.name == null) {
        resource._racksmeta.name = resourceName;
      }
      if (resource._racksmeta.singular == null) {
        if (resource._racksmeta.name.substr(-1) === 's') {
          resource._racksmeta.singular = resource._racksmeta.name.substr(0, resource._racksmeta.name.length - 1);
        } else {
          resource._racksmeta.singular = resource._racksmeta.name;
        }
      }
      resource._racksmeta.product = productName;
      rack = this;
      if (resource._racksmeta.target == null) {
        resource._racksmeta.target = function() {
          var resourcePath;
          if (resource._racksmeta.resourceString != null) {
            resourcePath = resource._racksmeta.resourceString;
          } else {
            resourcePath = this.name;
          }
          return rack[productName]._racksmeta.target() + resourcePath;
        };
      }
      if (!resource._racksmeta.noResource) {
        resource.all = (function(_this) {
          return function(callback) {
            return _this.resourceRequest(resource, callback);
          };
        })(this);
        resource.assume = (function(_this) {
          return function(obj) {
            if (typeof obj === 'string') {
              obj = {
                id: obj
              };
            }
            if ((obj.id == null) && (obj.name == null)) {
              return _this.log('[INFO] .assume() relies on .target() which in turn requires the object argument to have a .id or .name - please define one or the other - alternatively you can pass a string, in which case skinny will assume youre providing an id');
            }
            return _this.buildModel(resource, obj);
          };
        })(this);
        resource["new"] = (function(_this) {
          return function(obj, callback) {
            var data, replyString;
            data = {};
            data[resource._racksmeta.singular] = obj;
            if (resource._racksmeta.replyString != null) {
              replyString = resource._racksmeta.replyString;
            } else {
              replyString = resource._racksmeta.name;
            }
            return rack.post(resource._racksmeta.target(), data, function(reply) {
              if (reply[replyString] != null) {
                obj = reply[replyString];
              } else if (reply[resource._racksmeta.singular] != null) {
                obj = reply[resource._racksmeta.singular];
              } else {
                return callback(reply);
              }
              if (callback != null) {
                return callback(rack.buildModel(resource, obj));
              }
            });
          };
        })(this);
      }
      return resource;
    };

    RacksJS.prototype.buildCatalog = function(serviceCatalog) {
      var rack;
      rack = this;
      return serviceCatalog.forEach((function(_this) {
        return function(product) {
          var resource, resourceName, _ref, _results;
          if (product.name == null) {
            return false;
          }
          if (_this[product.name] != null) {
            _this[product.name]._racksmeta = {
              endpoints: product.endpoints,
              target: function() {
                var dc, target;
                target = false;
                if (rack.datacenter != null) {
                  dc = rack.datacenter;
                } else {
                  dc = rack.access.user['RAX-AUTH:defaultRegion'];
                }
                if (this.endpoints.length > 1) {
                  this.endpoints.forEach((function(_this) {
                    return function(endpoint) {
                      if (endpoint.region === dc) {
                        return target = endpoint[rack.network.toLowerCase() + 'URL'];
                      }
                    };
                  })(this));
                } else {
                  target = this.endpoints[0];
                }
                if (typeof target === 'object') {
                  target = target[rack.network.toLowerCase() + 'URL'];
                }
                if (rack.test) {
                  target = 'https://mockapi.com';
                }
                if (target.substr(-1) !== '/') {
                  target = target + '/';
                }
                return target;
              }
            };
            _this.products[product.name] = {};
            _ref = _this[product.name];
            _results = [];
            for (resourceName in _ref) {
              resource = _ref[resourceName];
              if (_this[product.name].hasOwnProperty(resourceName)) {
                if (resourceName !== '_racksmeta') {
                  _this[product.name][resourceName] = _this.buildResource(product.name, resourceName);
                  _results.push(_this.products[product.name][resourceName] = _this[product.name][resourceName]);
                } else {
                  _results.push(void 0);
                }
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          } else {
            return _this.log('no product named "' + product.name + '" found in racksjs - please contact the maintainers');
          }
        };
      })(this));
    };

    RacksJS.prototype.mockApi = function(opts, callback) {
      var cbObj, fakeEndpoints, product, _i, _len, _ref;
      if (opts.data == null) {
        return callback([
          {
            id: 1
          }, {
            id: 2
          }
        ]);
      }
      if (opts.data.match(/apiKeyCredentials/)) {
        fakeEndpoints = ['http://some-fake-testing-url.com', 0, 1, 2];
        cbObj = {
          access: {
            user: {
              'RAX-AUTH:defaultRegion': 'ORD'
            },
            token: {
              id: 'some-fake-testing-id'
            },
            serviceCatalog: []
          }
        };
        _ref = ['cloudServersOpenStack', 'cloudServers', 'cloudLoadBalancers', 'cloudFilesCDN', 'cloudFiles', 'cloudBlockStorage', 'cloudDatabases', 'cloudBackup', 'cloudDNS', 'cloudImages', 'cloudMonitoring'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          product = _ref[_i];
          cbObj.access.serviceCatalog.push({
            name: product,
            endpoints: fakeEndpoints
          });
        }
        return callback(cbObj);
      } else {
        return callback([
          {
            id: 1
          }, {
            id: 2
          }
        ]);
      }
    };

    RacksJS.prototype.buildProducts = function() {
      var rack;
      rack = this;
      this.cloudServersOpenStack = {
        networks: {
          _racksmeta: {
            resourceString: 'os-networksv2'
          },
          model: function(raw) {
            raw.show = function(callback) {
              var _ref;
              if ((_ref = raw.label) === 'public' || _ref === 'private') {
                return callback({
                  network: {
                    id: raw.id,
                    label: raw.label,
                    cidr: void 0
                  }
                });
              } else {
                return rack.get(this._racksmeta.target(), callback);
              }
            };
            raw["delete"] = function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            };
            return raw;
          }
        },
        flavors: {
          model: function(raw) {
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), callback);
            };
            raw.specs = function(callback) {
              return rack.get(this._racksmeta.target() + '/os-extra_specs', callback);
            };
            return raw;
          }
        },
        images: {
          model: function(raw) {
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), callback);
            };
            raw["delete"] = function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            };
            return raw;
          }
        },
        servers: {
          _racksmeta: {
            requiredFields: {
              name: 'string',
              imageRef: 'string',
              flavorRef: 'string'
            }
          },
          model: function(raw) {
            raw.systemActive = function(interval, callback) {
              var action, recurse;
              if (typeof interval === 'function') {
                callback = interval;
                interval = 15 * 1000;
              }
              action = (function(_this) {
                return function() {
                  return raw.details(function(reply) {
                    if (reply.status !== "ACTIVE") {
                      return recurse();
                    } else {
                      return callback(reply);
                    }
                  });
                };
              })(this);
              recurse = (function(_this) {
                return function() {
                  return setTimeout(action, interval);
                };
              })(this);
              return recurse();
            };
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), function(reply) {
                return callback(reply.server);
              });
            };
            raw.addresses = function(callback) {
              return rack.get(this._racksmeta.target() + '/ips', callback);
            };
            raw["delete"] = function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            };
            raw.update = function(options, callback) {
              if (options.server == null) {
                options = {
                  "server": options
                };
              }
              return rack.put(this._racksmeta.target(), options, callback);
            };
            raw.action = function(options, callback) {
              return rack.post(this._racksmeta.target() + '/action', options, callback);
            };
            raw.changePassword = function(password, callback) {
              return raw.action({
                changePassword: {
                  adminPass: password
                }
              }, callback);
            };
            raw.reboot = function(type, callback) {
              var cb;
              if (typeof type === 'function') {
                cb = type;
                type = 'SOFT';
              }
              return raw.action({
                reboot: {
                  type: type
                }
              }, callback);
            };
            raw.rescue = function(callback) {
              return raw.action({
                rescue: null
              }, callback);
            };
            raw.unrescue = function(callback) {
              return raw.action({
                unrescue: null
              }, callback);
            };
            raw.createImage = function(options, callback) {
              if (typeof options === 'string') {
                options = {
                  "createImage": {
                    "name": options
                  }
                };
              }
              return raw.action(options, callback);
            };
            raw.serverActions = function(callback) {
              return rack.get(this._racksmeta.target() + '/os-instance-actions', callback);
            };
            raw.showServerAction = function(id, callback) {
              return rack.get(this._racksmeta.target() + '/os-instance-actions/' + id, callback);
            };
            raw.resize = function(options, callback) {
              if (typeof options === 'string') {
                options = {
                  "flavorRef": options
                };
              }
              return raw.action({
                resize: options
              }, callback);
            };
            raw.confirmResize = function(callback) {
              return raw.action({
                confirmResize: null
              }, callback);
            };
            raw.revertResize = function(callback) {
              return raw.action({
                revertResize: null
              }, callback);
            };
            raw.rebuild = function(options, callback) {
              return raw.action({
                rebuild: options
              }, callback);
            };
            raw.attachVolume = function(options, callback) {
              return rack.post(this._racksmeta.target() + '/os-volume_attachments', options, callback);
            };
            raw.volumes = function(callback) {
              return rack.get(this._racksmeta.target() + '/os-volume_attachments', callback);
            };
            raw.volumeDetails = function(id, callback) {
              return rack.get(this._racksmeta.target() + '/os-volume_attachments/' + id, callback);
            };
            raw.detachVolume = function(callback) {
              return rack["delete"](this._racksmeta.target() + '/os-volume_attachments/' + id, callback);
            };
            raw.metadata = function(callback) {
              return rack.get(this._racksmeta.target() + '/metadata', callback);
            };
            raw.setMetadata = function(options, callback) {
              if (options.metadata == null) {
                options = {
                  'metadata': options
                };
              }
              if (callback == null) {
                callback = function() {
                  return false;
                };
              }
              return rack.put(this._racksmeta.target() + '/metadata', options, callback);
            };
            raw.updateMetadata = function(options, callback) {
              if (options.metadata == null) {
                options = {
                  'metadata': options
                };
              }
              return rack.post(this._racksmeta.target() + '/metadata', options, callback);
            };
            raw.getMetadataItem = function(key, callback) {
              return rack.get(this._racksmeta.target() + '/metadata/' + key, callback);
            };
            raw.setMetadataItem = function(key, options, callback) {
              if (options.metadata == null) {
                options = {
                  'metadata': options
                };
              }
              return rack.put(this._racksmeta.target() + '/metadata/' + key, options, callback);
            };
            raw.deleteMetadataItem = function(key, callback) {
              return rack["delete"](this._racksmeta.target() + '/metadata/' + key, callback);
            };
            raw.getVips = function(callback) {
              return rack.get(this._racksmeta.target() + '/os-virtual-interfacesv2', callback);
            };
            raw.attachNetwork = function(options, callback) {
              if (options.metadata == null) {
                options = {
                  'virtual_interface': options
                };
              }
              return rack.post(this._racksmeta.target() + '/os-virtual-interfacesv2', options, callback);
            };
            return raw;
          }
        },
        keys: {
          _racksmeta: {
            resourceString: 'os-keypairs'
          },
          model: function(raw) {
            raw["delete"] = function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            };
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), function(reply) {
                return callback(reply);
              });
            };
            return raw;
          }
        }
      };
      this.cloudServers = {
        servers: {
          model: function(raw) {
            return raw;
          }
        },
        images: {
          model: function(raw) {
            return raw;
          }
        },
        flavors: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudLoadBalancers = {
        algorithms: {
          model: function(raw) {
            return raw;
          }
        },
        alloweddomains: {
          model: function(raw) {
            return raw;
          }
        },
        protocols: {
          model: function(raw) {
            return raw;
          }
        },
        loadBalancers: {
          _racksmeta: {
            resourceString: 'loadbalancers'
          },
          model: function(raw) {
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), function(reply) {
                return callback(reply.server);
              });
            };
            return raw;
          }
        }
      };
      this.cloudFilesCDN = {};
      this.cloudFiles = {
        containers: {
          model: function(containerName) {
            var catalog;
            catalog = {
              name: containerName,
              _racksmeta: {
                name: containerName
              }
            };
            return catalog;
          }
        }
      };
      this.autoscale = {
        groups: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudBlockStorage = {
        volumes: {
          model: function(raw) {
            raw.details = function(callback) {
              return rack.get(this._racksmeta.target(), callback);
            };
            raw["delete"] = function(callback) {
              return rack["delete"](this._racksmeta.target(), callback);
            };
            raw.rename = function(options, callback) {
              if (typeof options === 'string') {
                options = {
                  "name": options
                };
              }
              if (options.volume == null) {
                options = {
                  "volume": options
                };
              }
              return rack.put(this._racksmeta.target(), options, callback);
            };
            raw.snapshot = function(options, callback) {
              if (typeof options === 'string') {
                options = {
                  "snapshot": {
                    "display_name": options
                  }
                };
              }
              options.snapshot.volume_id = raw.id;
              return rack.post(this.cloudBlockStorage._racksmeta.target() + '/snapshots', options, callback);
            };
            return raw;
          }
        },
        volumeDetails: function(callback) {
          return rack.get(this._racksmeta.target() + '/volumes/detail', callback);
        },
        types: {
          model: function(raw) {
            return raw;
          }
        },
        snapshots: {
          model: function(raw) {
            return raw;
          }
        },
        snapshotDetails: function(callback) {
          return rack.get(this._racksmeta.target() + '/snapshots/detail', callback);
        }
      };
      this.cloudDatabases = {
        instances: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudOrchestration = {};
      this.cloudQueues = {
        queues: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudBackup = {
        configurations: {
          model: function(raw) {
            return raw;
          }
        },
        agents: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudDNS = {
        limits: {
          model: function(raw) {
            return raw;
          }
        },
        domains: {
          _racksmeta: {
            singular: 'domains'
          },
          model: function(raw) {
            return raw;
          }
        },
        rdns: {
          model: function(raw) {
            return raw;
          }
        }
      };
      this.cloudImages = {};
      this.cloudMonitoring = {
        entities: {
          model: function(raw) {
            return raw;
          }
        },
        audits: {
          model: function(raw) {
            return raw;
          }
        },
        checkTypes: {
          model: function(raw) {
            return raw;
          }
        },
        monitoringZones: {
          model: function(raw) {
            return raw;
          }
        },
        notifications: {
          model: function(raw) {
            return raw;
          }
        },
        agents: {
          model: function(raw) {
            return raw;
          }
        },
        notification_plans: {
          model: function(raw) {
            return raw;
          }
        },
        overview: function(callback) {
          return rack.get(this._racksmeta.target() + '/views/overview', callback);
        },
        account: function(callback) {
          return rack.get(this._racksmeta.target() + '/account', callback);
        },
        updateAccount: function(options, callback) {
          return rack.put(this._racksmeta.target() + '/account', options, callback);
        },
        limits: function(callback) {
          return rack.get(this._racksmeta.target() + '/limits', callback);
        },
        usage: function(callback) {
          return rack.get(this._racksmeta.target() + '/usage', callback);
        },
        changelogs: function(callback) {
          return rack.get(this._racksmeta.target() + '/changelogs/alarms', callback);
        }
      };
      this.servers = this.cloudServersOpenStack.servers;
      this.networks = this.cloudServersOpenStack.networks;
      this.ngservers = this.cloudServersOpenStack.servers;
      this.nextgen = this.cloudServersOpenStack;
      this.fgservers = this.cloudServers.servers;
      this.firstgen = this.cloudServers;
      return this.clbs = this.cloudLoadBalancers.loadBalancers;
    };

    return RacksJS;

  })();

}).call(this);
