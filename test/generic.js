#!/usr/bin/env node
// Include racks.js
var RacksJS = require('../racks.js');
new RacksJS({
    // Username and APIKEY for rackspace
    username: process.argv[2],
    apiKey: process.argv[3],
    verbosity: 5
}, function (rack) {
	if (rack.error) {
		return console.log(rack.error);
	}
	rack.cloudMonitoring.overview(function (reply) {

	});
	//rack.autoscale.groups.all(function (volumes) {
	//	console.log(volumes);
	//});
	//rack.cloudServersOpenStack.networks.all(function (networks) {
	//	networks.forEach(function (network) {
	//		network.show(function (reply) {
	//			console.log(reply);
	//		});
	//	});
	//});
	//rack.cf.all(function (containers) {
	//	containers.forEach(function (container) {
	//		console.log(container);
	//	});
	//});
	//rack.cf.all(function (containers) {
	//	containers.forEach(function (container) {
	//		container.listObjects(function (objects) {
	//			console.log(objects);
	//		});
	//	});
	//});
	//rack.servers.all(function (servers) {
	//	servers[1].vips(function (reply) {
	//		console.log(reply);
	//	});
	//});
	//rack.post('https://identity.api.rackspacecloud.com/v2.0/tokens', {
	//	auth: {
	//		"tenantId": "808571",
	//		"token": {
	//			id: rack.authToken
	//		}
	//	}
	//}, function (reply) {
	//	console.log(reply);
	//});
	//rack.serviceCatalog.forEach(function (catalog) {
	//	if (catalog.name === 'cloudOrchestration') {
	//		console.log(catalog.endpoints);
	//	}
	//});
	//rack.clbs.all(function (servers) {
	//	servers.forEach(function (server) {
	//		server.updateMetadata({
	//			'rax_service_level_automation': 'Complete'
	//		}, function (reply) {
	//			console.log(reply);
	//		});
	//		server.listMetadata(function (details) {
	//			console.log(details);
	//		});
	//		server.reboot(function (reply) {
	//			console.log(reply);
	//		});
	//		server.details(function (reply) {
	//			console.log(reply);
	//		})
	//		server.addresses(function (reply) {
	//			console.log(reply.addresses);
	//		});
	//	});
	//});
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
