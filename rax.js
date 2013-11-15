// Rax.js 0.2 by Seandon Mooy and Matt Ellsworth
// A browser-friendly SDK for the Rackspace Cloud
//
// TODOS:
// [ ] flush out products to match rax.js 0.1
// [ ] add where, find to RaxJS.prototype.resource
// [ ] add auth .expires awareness
// [ ] add CORS support / Make sure everything works in the browser (flush out browser test)
// [ ] add skeleton for things like autoscale (ie: non-resource functions of serviceCatalog)
// [ ] create a github wiki / github.io will demo/how to/documentation
// [ ] flush out some sensable tests
// [ ] better methodology for flexable arguments
// CODING GUIDELINES:
// - Always return parsed JSON to the user, -never- stringified JSON
// - Standardize API response as much as possible. See server.addresses for example
//
// Wrapper closure for browser/node compatability
(function () {
	// jQuery for nodejs
	if (typeof window === "undefined") {
		var jQuery = require('jquery'),
			XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	} else if (typeof window.jQuery === "undefined") {
		console.log('Missing jQuery!');
	} else {
		var jQuery = window.jQuery;
	}
	// Core class
	var RaxJS = (function () {
		"use strict";
		// Constructor
		function RaxJS (authObject, raxReadyCallback) {
			var _rax = this;
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
			this.authenticate(authObject, function () {
				_rax.buildProductCatalog();
				raxReadyCallback();
			});
		}
		// HTTP Request wrapper - wrap's jQuery's .ajax, which is node/browser
		// compatable with defaults suitable for Rackspace API
		RaxJS.prototype.ajax = function (options) {
			if (typeof options.data === "object") {
				options.data = JSON.stringify(options.data);
			}
			if (typeof options.contentType === "undefined") {
				options.contentType = "application/json; charset=utf-8";
			}
			if (typeof options.dataType === "undefined") {
				options.dataType = "json";
			}
			if (this.authAccess.token.id) {
				if (typeof options.headers === "undefined") {
					options.headers = {};
				}
				options.headers["X-Auth-Token"] = this.authAccess.token.id;
			}
			jQuery.support.cors = true;
			return jQuery.ajax(options);
		};
		// Authentication via identity api v2.0 - writes out access to this.authAccess and callsback
		RaxJS.prototype.authenticate = function (authObjectRequest, callback) {
			var _rax = this;
			// TODO: validate presense on authObjectRequest options.
			this.ajax({
				type: 'POST',
				url: 'https://identity.api.rackspacecloud.com/v2.0/tokens',
				data: { 'auth': { 'RAX-KSKEY:apiKeyCredentials': {
					'username': authObjectRequest.username, 'apiKey': authObjectRequest.apiKey
				} } }
			}).done(function (authObjectReply) {
				_rax.authAccess = authObjectReply.access;
				//console.log(authObjectReply);
				callback();
			}).fail(function (xhr) {
				console.log('Authenticate Failure', xhr.responseText);
			});
		};
		// RESTful resource wrapper - uses product's endpoints and resource's uris to create common functions - all, where, etc.
		RaxJS.prototype.resource = function (product, resourceName, resource) {
			var _rax = this,
				resourceString = resourceName,
				url;
			if (typeof resource.resourceString !== "undefined") {
				resourceString = resource.resourceString;
			}
			url = product.target.publicURL + '/' + resourceString;
			//console.log(product.name, resourceName, url, _rax.products[product.name][resourceName]);
			return {
				all: function (callback) {
					_rax.ajax({
						type: 'GET',
						url: url
					}).done(function (reply) {
						// inconsistent? behavior... I believe cloud files is the only offender so far
						if (typeof reply[resourceName] !== "undefined") {
							reply = reply[resourceName];
						} else {
							reply = reply;
						}
						var response = [];
						reply.forEach(function (rawResource) {
							rawResource.target = url + '/' + rawResource.id;
							response.push(new _rax.products[product.name][resourceName].model(_rax, product, rawResource));
						});
						callback(response);
					}).fail(function (error) {
						console.log(resourceName, '.all() failure on', url, 'error:', error);
					});
				},
				find: function () {
				},
				where: function () {
				},
				new: function () {

				}
			};
		};
		// Interpret the ServiceCatalog (from authenticate()) and bind our functionality
		// to easy-to-use objects according to product names and resources. For instance:
		// This function interprets authAccess.serviceCatalog, matching them against RaxJS.prototype.products
		// then binds RaxJS.PRODUCTNAME.RESOURCE.methods -> ie: RaxJS.cloudServersOpenStack.servers.all()
		// these functions return arrays containing the objects you'll find above in RaxJS.prototype.products ->
		// this is where all the Rackspace functionality lives - ie:
		// RaxJS.cloudServersOpenStack.servers.all(function (servers) {
		//   servers.forEach(function (server) {
		//     server.shutdown();
		//   })
		// });
		// with the exception of creation - ie: RaxJS.cloudServersOpenStack.servers.new()
		RaxJS.prototype.buildProductCatalog = function () {
			var _rax = this;
			// for each product in the service catalog
			this.authAccess.serviceCatalog.forEach(function (rawProduct) {
				// if we have a matching product defintion
				if (typeof _rax.products[rawProduct.name] !== "undefined") {
					_rax[rawProduct.name] = {
						endpoints: rawProduct.endpoints,
						name: rawProduct.name,
						target: false,
						selectEndpoint: function (targetDC) {
							var _product = this;
							if (typeof this.endpoints !== "undefined") {
								if (this.endpoints.length > 1) {
									this.endpoints.forEach(function (endpoint) {
										if (endpoint.region === targetDC) {
											_product.target = endpoint;
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
					_rax[rawProduct.name].selectEndpoint(_rax.authAccess.user['RAX-AUTH:defaultRegion']);
					// bind the resource functions to each resource listed within the product.
					jQuery.each(_rax.products[rawProduct.name], function (resourceName, resource) {
						_rax[rawProduct.name][resourceName] = _rax.resource(_rax[rawProduct.name], resourceName, resource);
					});
				}
			});
		};
		// Product catalog and mapping
		RaxJS.prototype.products = {
			// Products
			'cloudServersOpenStack': {
				// Resources
				'servers': {
					model: function (_rax, product, resource) {
						// Resource level functionality
						/* get server details - http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Get_Server_Details-d1e2623.html
						.details(function (serverDetails) {})
						*/
						resource.details = function (callback) {
							_rax.ajax({
								type: 'GET',
								url: resource.links[0].href
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
							_rax.ajax({
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
							_rax.ajax({
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
							_rax.ajax({
								type: 'POST',
								url: resource.links[0].href + '/action',
								data: actionObject
							}).done(function (reply){
								callback(reply);
							}).fail(function (error) {
								//callback(error);
								console.log(resource.name, ".action('" + action + "') failure, error:", error);
							});
						}
						//The following are simply shortcuts for the .action() method.
						resource.changePassword = function (newPassword, callback) {
							resource.action({ "changePassword": {
								"adminPass": newPassword
							}	}, callback);
						};
						resource.reboot = function () {
							var type = 'SOFT',
								callback = function () {}
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
						resource.createImage = function () {

						};
						//http://docs.rackspace.com/servers/api/v2/cs-devguide/content/MetadataSection.html
						resource.metadata = function () {

						};
						return resource;
					}
				},
				'images': {
					model: function (_rax, product, resource) {
						return resource;
					}
				},
				'flavors': {
					model: function (_rax, product, resource) {
						return resource;
					}
				}
			},
			'cloudLoadBalancers': {
				'loadBalancers': {
					// Sometimes we have to remap the name as it comes back from the API - this is a slightly odd edge case
					// service catalog is "loadBalancer", api only responds to "loadbalancer".
					resourceString: 'loadbalancers',
					model: function (_rax, product, resource) {
						return resource;
					}
				},
				'limits': {
					model: function (_rax, product, resource) {
						return resource;
					}
				}
			},
			'cloudFiles': {
				'containers': {
					resourceString: '',	// cloud files has no resource name - just uses the base product url.
					model: function (_rax, product, resource) {
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
					model: function (_rax, product, resource) {
						return resource;
					}
				}
			},
			'cloudMonitoring': {

			},
			'cloudBackup': {

			}
		};
		return RaxJS;
	})();
	// Browser + node friendly export
	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = RaxJS;
	} else {
		window.RaxJS = RaxJS;
	}

})();

