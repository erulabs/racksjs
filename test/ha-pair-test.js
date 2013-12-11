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
        console.log(rack.error);
        return false;
    }

    var assets = {};
    // Creating a new server
    function newServer (name) {
	    rack.cloudServersOpenStack.servers.new({
	        // Gentoo 13.3
	        "imageRef": "73764eb8-3c1c-42a9-8fff-71f6beefc6a7",
	        "name": name,
	        // 512 standard
	        "flavorRef": "2"
	    }, function (server) {
	        var progressCheck = function () {
	            setTimeout(function () {  
	                server.details(function (details) {
	                    if (details.progress < 100) {
	                        console.log(details.progress + '%');
	                        progressCheck();
	                    } else {
	                    	assets[name] = server;
	                    	assets[name].loadedDetails = details;
	                    	buildComplete();
	                        console.log('build complete! root pw:', server.adminPass, 'server id:', server.id);

	                    }
	                });
	            }, 15000);
	        };
	        progressCheck();
	    });
   	}
    // New Cloud Load Balancer
    function newLB (name) {
	    rack.cloudLoadBalancers.loadBalancers.new({
	        'name': name
	    }, function (loadbalancer) {
	        var progressCheck = function () {
	            setTimeout(function () {  
	                loadbalancer.details(function (details) {
	                    if (details.status === 'BUILD') {
	                        progressCheck();
	                    } else if (details.status === 'ACTIVE') {
	                        console.log('load balancer build complete!');
	                        assets[name] = loadbalancer;
	                        assets[name].loadedDetails = details;
	                        buildComplete();
	                    } else {
	                        console.log('Some error occured!', details.status);
	                    }
	                });
	            }, 15000);
	        };
	        progressCheck();
	    });
	}
	newServer('ha-test1');
	newServer('ha-test2');
	newLB('ha-test-lb');
	function buildComplete () {
		if (assets['ha-test1'] !== undefined && assets['ha-test2'] !== undefined && assets['ha-test-lb'] !== undefined) {
			console.log('servers and LBs created - linking');
			console.log(assets['ha-test1'].loadedDetails.addresses.public);
			//assets['ha-test-lb'].addNode([
			//	{
			//		'address': assets['ha-test1'].loadedDetails.addresses.public
			//	}
			//]);
		}
	};

    /*
    Listing flavors and images
    rack.cloudServersOpenStack.flavors.all(function (flavors) {
        console.log(flavors);
    });
    rack.cloudServersOpenStack.images.all(function (images) {
        console.log(images);
    });*/
    // Some products have "product-level" functionality - ie: special commands that are product specific
    //  but do not have to do with a particular instance of a product
    //  our general syntax for this looks like:
    /*rack.cloudLoadBalancers.loadBalancers.usage(function (usage){
        console.log(usage);
    });*/
    /* An example of some loadBalancer functionality
    rack.cloudLoadBalancers.loadBalancers.all(function (loadBalancers) {
        loadBalancers.forEach(function (loadBalancer){
            loadBalancer.vips(function (vips) {
                console.log(vips);
            });
            loadBalancer.addNode([
                {
                    'address': '166.78.237.29',
                    'port': 80,
                    'condition': 'ENABLED',
                    'type': 'PRIMARY'
                }
            ], function () {
                loadBalancer.listNodes(function (nodes) {
                    console.log('listing nodes', nodes);
                });
            });
        });
    });*/
    /* An example of grabbing all the details for all your next-gen servers */
    //rack.cloudServersOpenStack.servers.all(function (servers) {
    //    console.log(servers);
    //    //servers.forEach(function (server) {
    //    //    server.details(function (details) {
    //    //        console.log(details);
    //    //    });
    //    //});
    //});
    /* Resource's .find(UUID)
    rack.cloudServersOpenStack.servers.find('35768af2-0229-4e1f-879b-d9abf10ff245', function(myServer) {
        console.log(myServer);
    });*/
});