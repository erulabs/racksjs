#!/usr/bin/env node
// Include racks.js and start it with a few settings
var RacksJS = require('../racks.js');
new RacksJS({
    // Username and APIKEY for rackspace
    username: process.argv[2],
    apiKey: process.argv[3],
    // Anything above 0 will 'console.log', 5 will print debug output
    verbosity: 5,
    // Save a cache file to avoid unneeded authentication calls
    // cache = 'someOtherFile' works as expected - !undefined defaults to '.racksjs'
    cache: true
}, function (rack) {
	if (rack.error) {
		return console.log(rack.error);
	}
	var r = rack;

	r.networks.all(function (networks) {
		networks.forEach(function (network) {
			network.show(function (reply) {
				console.log(reply);
			});
		});
	});

	//r.cf.all(function (containers) {
	//	console.log(containers);
	//});

	//r.clbs.all(function (clbs) {
	//	clbs[0].details(function (reply) {
	//		console.log(reply);
	//	});
	//});

	//rack.cloudDNS.domains.all(function (domains) {
	//	domains.forEach(function (domain) {
	//		domain.records.all(function (records) {
	//			console.log('RECORDS', records);
	//		});
	//	});
	//});

	//rack.servers.all(function (servers) {
	//	servers.forEach(function (server) {
	//		if (server.name.indexOf('WebHead') > -1) {
	//			server.listMetadata(function (reply) {
	//				console.log(reply);
	//			});
	//		}
	//	});
	//});

	//console.log(typeof rack.products.cloudMonitoring.overview);
	//rack.cloudMonitoring.overview(function (reply) {

	//});
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
	//		container.listObjects(function (reply) {
	//			console.log(reply);
	//		});
	//	});
	//});
	//rack.cf.all(function (containers) {
	//	containers.forEach(function (container) {
	//		container.listObjects(function (objects) {
	//			console.log(objects);
	//		});
	//	});
	//});
	// You can also "Assume" models to bind their functionality without making any API calls
	// you'll need to know the 'id' or 'name' before hand.
	//rack.servers.assume({
	//	id: '20b38086-c4ed-4629-a057-2d0e87e27840'
	//}, function (server) {
	//	console.log(server);
	//	server.details(function (reply) {
	//		console.log(reply);
	//	});
	//});
	//rack.servers.all(function (servers) {
	//	servers[1].details(function (reply) {
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
	//	lbs.forEach(function (lb) {
	//		lb.nodes.all(function (nodes) {
	//			console.log(nodes);
	//		});
	//	});
	//});
});
