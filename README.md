# Racks.js
### a javascript SDK for the Rackspace Cloud
by Seandon Mooy and Matt Ellsworth

  This is the offical renaming of "raxjs" - additionally, it is based on the previously titled "v2" branch. This repo is currently under heavy construction in an attempt to get the rewrite up to speed with raxjs v1.

### Usage
    #!/usr/bin/env node
    // Include racks.js
    var RacksJS = require('../racks.js');
    new RacksJS({
        // Username and APIKEY for rackspace
        username: process.argv[2],
        apiKey: process.argv[3]
    }, function (rack) {
        if (rack.error) {
            console.log(rack.error);
            return false;
        }
        /*
        // Creating a new server
        rack.cloudServersOpenStack.servers.new({
            // Gentoo 13.3
            "imageRef": "73764eb8-3c1c-42a9-8fff-71f6beefc6a7",
            "name": "racksjs test 1",
            // 512 standard
            "flavorRef": "2"
        }, function (reply) {
            console.log(reply);
        });*/
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
        /* An example of grabbing all the details for all your next-gen servers
        rack.cloudServersOpenStack.servers.all(function (servers) {
            servers.forEach(function (server) {
                server.details(function (details) {
                    console.log(details);
                });
            });
        }); */
        /* Resource's .find(UUID)
        rack.cloudServersOpenStack.servers.find('35768af2-0229-4e1f-879b-d9abf10ff245', function(myServer) {
            console.log(myServer);
        });*/
    });

### Important info
This repo is not an official rackspace SDK and as such don't expect anyone to support it! (outside of this github). Unless you're messing around with experimental code, I highly recommend using nodejitsu's pkgcloud.

Rack.js is by design, not abstracted away from rackspace's cloud API (docs.rackspace.com). It will never work with other prodivers, but rather, acts as a direct one-to-one documentation-to-functionality javascript bridge. Unlike many other cloud SDKs, there is no invented vocabulary - just product names.

Feel free to issue pull requests :) Thanks!

- Seandon Mooy