// Racks.js - a javascript SDK for the Rackspace Cloud
// by Seandon Mooy and Matt Ellsworth
// 
// TODOS:
// [ ] flush out products to match rax.js 0.1
// [ ] add where, find to RacksJS.prototype.resource
// [ ] Rewrite endpoint/target system - currently there are two problems:
//		1) we use .publicURL, when we should use a variable _useServiceNet_, etc.
//		2) the targets are set once, which means you can't change the endpoints of existing objects easily
//		3) .target is an object on the product, which sucks, because you cant iterate over the product to get the resources easily
//		3.1) .target ought to be a string (or a function which gets the current target every time, based on _useServiceNet_, etc)
// [ ] add auth .expires awareness
// [ ] add skeleton for things like autoscale (ie: non-resource functions of serviceCatalog)
// [ ] create a github wiki / github.io will demo/how to/documentation
// [ ] flush out some sensible tests
// [ ] better methodology for flexible arguments
// CODING GUIDELINES:
// - Always return parsed JSON to the user, -never- stringified JSON
(function () {
	// jQuery for nodejs
	var jQuery,
		XMLHttpRequest,
		// 0 = no logging
		// 1 = log requests
		// 2 = log replies
		// 3 = log all
		RacksVerbosity = 3;
	if (typeof window === "undefined") {
		jQuery = require('jquery');
		XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	} else if (typeof window.jQuery === "undefined") {
		console.log('Missing jQuery!');
	} else {
		jQuery = window.jQuery;
	}
	// Core class
	var RacksJS = (function () {
		// Constructor
		function RacksJS (authObject, raxReadyCallback) {
			"use strict";
			var _racks = this;
			this.debugSetting = true;
			this.authAccess = {
				token: {
					id: false
				}
			};
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
			if (authObject === undefined) {
				console.log('No authentication object provided');
				return false;
			}
			this.authenticate(authObject, function (error) {
				if (error) {
					_racks.error = error;
				} else {
					_racks.error = false;
					_racks.buildProductCatalog();
				}
				raxReadyCallback(_racks);
			});
		}
		// HTTP Request wrapper - wrap's jQuery's .ajax, which is node/browser
		// compatible with defaults suitable for Rackspace API
		RacksJS.prototype.ajax = function (options) {
			if (typeof options.data === "object") {
				options.data = JSON.stringify(options.data);
			}
			if (options.contentType === undefined) {
				options.contentType = "application/json; charset=utf-8";
			}
			if (options.dataType === undefined) {
				options.dataType = "json";
			}
			if (this.authAccess.token.id) {
				if (options.headers === undefined) {
					options.headers = {};
				}
				options.headers["X-Auth-Token"] = this.authAccess.token.id;
			}
			jQuery.support.cors = true;
			if (RacksVerbosity === 1) {
				console.log(options.type, options.url);
			} else if (RacksVerbosity === 3) {
				console.log('-> HTTP:', options, "\n==============================");
			}
			return jQuery.ajax(options);
		};
		// Authentication via identity api v2.0 - writes out access to this.authAccess and callsback
		RacksJS.prototype.authenticate = function (authObjectRequest, callback) {
			var _racks = this;
			// TODO: validate presence on authObjectRequest options.
			this.ajax({
				type: 'POST',
				url: 'https://identity.api.rackspacecloud.com/v2.0/tokens',
				data: { 'auth': { 'RAX-KSKEY:apiKeyCredentials': {
					'username': authObjectRequest.username, 'apiKey': authObjectRequest.apiKey
				} } }
			}).done(function (authObjectReply) {
				_racks.authAccess = authObjectReply.access;
				callback(false);
			}).fail(function (xhr) {
				callback('Authentication Failure: ' + xhr.responseText);
			});
		};
		// Take a raw response and wrap it to the product.model, if it exists
		RacksJS.prototype.model = function (product, resourceName, url, rawResources) {
			var _racks = this,
				resourceModel,
				singular = RacksJS.prototype.products[product.name][resourceName].singular;
			// assuming we have a model to map to
			if (_racks.products[product.name][resourceName].model !== undefined) {
				var response = [];
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
						return resourceModel;
					} else {
						console.log('.model() Unexpected reply for ', resourceName, '- not an array, nor matching singular "' + singular + '". Reply:', rawResources);
						return rawResources;
					}
				}
				return response;
			// otherwise return the raw reply
			} else {
				return rawResources;
			}
		}
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
					resource.singular = resourceName.substr(0, resourceName.length-1);
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
			function interpretAPIResponse (reply) {
				if (reply[resourceName] !== undefined) {
					reply = reply[resourceName];
				} else {
					reply = reply;
				}
				return reply;
			};
			resource.all = function (callback) {
				_racks.ajax({
					type: 'GET',
					url: url
				}).done(function (reply) { 
					reply = interpretAPIResponse(reply);
					callback(_racks.model(product, resourceName, url, reply));
				}).fail(function (error) {
					console.log(resourceName, '.all() failure on', url, 'error:', error);
				});
			};
			resource.find = function (uuid, callback) {
				_racks.ajax({
					type: 'GET',
					url: url + '/' + uuid
				}).done(function (reply) { 
					reply = interpretAPIResponse(reply);
					callback(_racks.model(product, resourceName, url, reply));
				}).fail(function (error) {
					console.log(resourceName, '.find() failure on', url, 'error:', error);
				});
			};
			resource.where = function () {
			};
			resource.new = function (serverObj, callback) {
				if (serverObj.flavorRef === undefined) {
					return console.log(resourceName, '.new() - no flavorRef given - failing');
				}
				if (serverObj.name === undefined) {
					return console.log(resourceName, '.new() - no name given - failing');
				}
				if (serverObj.imageRef === undefined) {
					return console.log(resourceName, '.new() - no imageRef given - failing');
				}
				_racks.ajax({
					type: 'POST',
					url: url,
					data: {
						"server": serverObj
					}
				}).done(function (reply) {
					reply = interpretAPIResponse(reply);
					callback(_racks.model(product, resourceName, url, reply));
				}).fail(function (error) {
					console.log(resourceName, '.new() failure on', url, 'error:', error);
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
					jQuery.each(_racks.products[rawProduct.name], function (resourceName, resource) {
						if (resourceName !== "target") {
							//console.log('binding', rawProduct.name, resourceName);
							_racks[rawProduct.name][resourceName] = _racks.resource(_racks[rawProduct.name], resourceName, resource);
						}
					});
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
							_racks.ajax({
								type: 'GET',
								url: resource.target
							}).done(function (reply){
								callback(reply.server);
							}).fail(function (error) {
								console.log(resource.name, '.details() failure, error:', error);
							});
						};
						/* get server addresses - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/ServerAddresses.html
						.addresses('networklabel', function (serverAddresses) {})
						.addresses(function (serverAddresses) {})
						*/
						resource.addresses = function () {
							// Sort arguments
							var networkLabel = false,
								callback,
								url = resource.links[0].href + '/ips';
							if (arguments.length == 1) {
								callback = arguments[0];
							} else if (arguments.length == 2) {
								networkLabel = arguments[0];
								callback = arguments[1];
							} else {
								console.log('.addresses() No callback provided - no output from this request is possible! Skipping.');
								return false;
							}
							if (networkLabel) {
								url = url + '/' + networkLabel;
							}
							_racks.ajax({
								type: 'GET',
								url: url
							}).done(function (reply){
								// standarize reply between networkLabel / all
								if (typeof reply.addresses === "object") {
									reply = reply.addresses;
								}
								callback(reply);
							}).fail(function (error) {
								console.log(resource.name, '.addresses() failure, error:', error);
							});
						};
						/* delete server - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Delete_Server-d1e2883.html
						.delete(function (success, errorMessage) {})
						if success == false, errorMessage is provided
						*/
						resource.delete = function () {
							_racks.ajax({
								type: 'DELETE',
								url: resource.links[0].href
							}).done(function (reply){
								callback(true);
							}).fail(function (error) {
								callback(false, error);
								console.log(resource.name, '.delete() failure, error:', error);
							});
						};
						/* general action wrapper - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Server_Actions-d1e3229.html
						*/
						resource.action = function (actionObject, callback) {
							if (typeof callback === "undefined") {
								callback = function () {};
							}
							_racks.ajax({
								type: 'POST',
								url: resource.links[0].href + '/action',
								data: actionObject
							}).done(function (reply){
								callback(reply);
							}).fail(function (error) {
								console.log(resource.name, ".action('" + action + "') failure, error:", error);
							});
						};
						//The following are simply shortcuts for the .action() method.
						resource.changePassword = function (newPassword, callback) {
							resource.action({ "changePassword": {
								"adminPass": newPassword
							}	}, callback);
						};
						resource.reboot = function () {
							var type = 'SOFT',
								callback = function () {};
							if (arguments.length == 1) {
								callback = arguments[0];
							} else if (arguments.length == 2) {
								type = arguments[0];
								callback = arguments[1];
							}
							resource.action({ "reboot": {
								"type": type
							}	}, callback);
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
								}
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
							_racks.ajax({
								type: 'GET',
								url: resource.target + '/nodes'
							}).done(function (reply){
								callback(reply.nodes);
							}).fail(function (error) {
								console.log(resource.name, '.details() failure, error:', error);
							});
						};
						resource.addNode = function (newNodes, callback) {
							// Todo: add error checking here
							_racks.ajax({
								type: 'POST',
								url: resource.target + '/nodes',
								data: {
									"nodes": newNodes
								}
							}).done(function (reply){
								callback(reply);
							}).fail(function (error) {
								console.log(resource.name, '.details() failure, error:', error);
							});
						};
						resource.listVirtualIPs = function (callback) {
							_racks.ajax({
								type: 'GET',
								url: resource.target + '/virtualips'
							}).done(function (reply){
								callback(reply.virtualIps);
							}).fail(function (error) {
								console.log(resource.name, '.details() failure, error:', error);
							});
						};
						resource.vips = function (callback) {
							resource.listVirtualIPs(callback);
						};
						return resource;
					},
					// Account level LB usage query
					usage: function (callback) {
						var product = RacksJS.prototype.products['cloudLoadBalancers'],
							url = product.target.publicURL,
							// Get a reference to the instance -
							// TODO: This is ugly, and shouldn't be nessisary
							_racks = RacksJS.prototype._racks;
						_racks.ajax({
							type: 'GET',
							// Todo: /loadbalancers/ ought to be prepended to our target automatically
							// Its not, since this isn't a model level function
							url: url + '/loadbalancers/usage'
						}).done(function (reply){
							callback(reply);
						}).fail(function (error) {
							console.log('cloudLoadBalancers .usage() failure, url:, ', url, 'error:', error);
						});
					}
				},
				// Sometimes there is no functionality associated with a reply.
				// In that case, we define the resource so that we can do limits.all, but not the model
				'limits': {}
			},
			'cloudFiles': {
				'containers': {
					resourceString: '',	// cloud files has no resource name - just uses the base product url.
					model: function (_racks, product, resource) {
						return resource;
					}
				}
			},
			'cloudFilesCDN': {
			},
			'cloudBlockStorage': {
			},
			'cloudDatabases': {
			},
			'autoscale': {
			},
			'cloudServers': {
			},
			'cloudDNS': {
				'domains': {
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
	})();
	// Browser + node friendly export
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = RacksJS;
	} else {
		window.RacksJS = RacksJS;
	}
})();