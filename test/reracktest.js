#!/usr/bin/env node
// Include racks.js
var RacksJS = require('../rerack.js');
new RacksJS({
    // Username and APIKEY for rackspace
    username: process.argv[2],
    apiKey: process.argv[3],
    verbosity: 5
}, function (rack) {
	if (rack.error) {
		return console.log(rack.error);
	}
	rack.cloudServersOpenStack.servers.all(function (servers) {
		servers.forEach(function (server) {
			if (server.name === 'erulabs.com') {
				console.log(server);
				server.reboot(function (reply) {
					console.log(reply);
				});
			}
			//server.addresses(function (reply) {
			//	console.log(reply.addresses);
			//});
		});
	});
	// New feature!!! Interact with _all_ products
	//for (productName in rack.products) {
	//	for (resourceName in rack.products[productName]) {
	//		rack.products[productName][resourceName].all(function (reply) {
	//			console.log(reply);
	//		});
	//	}
	//}
	//rack.cloudLoadBalancers.loadBalancers.all(function (lbs) {
	//	console.log(lbs);
	//});
});
