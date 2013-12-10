#!/usr/bin/env node
var RacksJS = require('../racks.js');
new RacksJS({
    username: process.argv[2],
    apiKey: process.argv[3]
}, function (rack) {
    if (rack.error) {
        console.log(rack.error);
        return false;
    }
    /*rack.cloudServersOpenStack.servers.new({
        // Gentoo 13.3
        "imageRef": "73764eb8-3c1c-42a9-8fff-71f6beefc6a7",
        "name": "racksjs test 1",
        // 512 standard
        "flavorRef": "2"
    }, function (reply) {
        console.log(reply);
    });*/
    //rack.cloudServersOpenStack.flavors.all(function (flavors) {
    //    console.log(flavors);
    //});
    //rack.cloudServersOpenStack.images.all(function (images) {
    //    console.log(images);
    //});
    //console.log(rack.cloudLoadBalancers.loadBalancers);
    // Some products have "product-level" functionality - ie: special commands that are product specific
    //  but do not have to do with a particular instance of a product
    //  our general syntax for this looks like:
    //rack.cloudLoadBalancers.loadBalancers.usage(function (usage){
    //    console.log(usage);
    //});
    //
    //
    //rack.cloudLoadBalancers.loadBalancers.all(function (loadBalancers) {
    //    //console.log(loadBalancers);
    //    loadBalancers.forEach(function (loadBalancer){
    //        loadBalancer.vips(function (vips) {
    //            console.log(vips);
    //        });
    //        loadBalancer.addNode([
    //            {
    //                'address': '166.78.237.29',
    //                'port': 80,
    //                'condition': 'ENABLED',
    //                'type': 'PRIMARY'
    //            }
    //        ], function () {
    //            loadBalancer.listNodes(function (nodes) {
    //                console.log('listing nodes', nodes);
    //            });
    //        });
    //    });
    //});
    rack.cloudServersOpenStack.servers.all(function (servers) {
        servers.forEach(function (server) {
            if (server.name === "racksjs test 1") {
                server.details(function (details) {
                    console.log(details);
                });
            }
        });
    });
});