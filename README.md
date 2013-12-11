# Racks.js
### a javascript SDK for the Rackspace Cloud
by Seandon Mooy with contributions from Matt Ellsworth

### About / News

Racksjs is mostly an attempt by the author to get intimate with the Rackspace API. It's also quite nice to script with - particularly because it doesn't invent any vocabulary - it simply wraps the rackspace api documentation as closely as possible.

Proper documentation and a lot more examples are soon to come - we're still missing a lot of functionality, but that too is on its way! For now, here is some example code:

### Usage
    // Include racks.js
    var RacksJS = require('racks.js');
    new RacksJS({
        // Username and APIKEY for rackspace
        username: 'RACKSPACE USERNAME',
        apiKey: 'RACKSPACE APIKEY'
    }, function (rack) {
        if (rack.error) {
            console.log(rack.error);
            return false;
        }
        // Creating a new server
        rack.cloudServersOpenStack.servers.new({
            "name": "some example server",
            "imageRef": "73764eb8-3c1c-42a9-8fff-71f6beefc6a7", // Gentoo 13.3
            "flavorRef": "2" // 512mb standard
        }, function (reply) {
            console.log(reply);
        });
        // Listing flavors and images
        rack.cloudServersOpenStack.flavors.all(function (flavors) {
            console.log(flavors);
        });
        rack.cloudServersOpenStack.images.all(function (images) {
            console.log(images);
        });
        // Some products have "product-level" functionality - ie: special commands that are product specific
        //  but do not have to do with a particular instance of a product
        //  our general syntax for this looks like:
        rack.cloudLoadBalancers.loadBalancers.usage(function (usage){
            console.log(usage);
        });
        // An example of some loadBalancer functionality
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
        });
        // An example of grabbing all the details for all your next-gen servers
        rack.cloudServersOpenStack.servers.all(function (servers) {
            servers.forEach(function (server) {
                server.details(function (details) {
                    console.log(details);
                });
            });
        });
        // Resource's .find(UUID)
        rack.cloudServersOpenStack.servers.find('35768af2-0229-4e1f-879b-d9abf10ff245', function(myServer) {
            console.log(myServer);
        });
    });

### Important info
This repo is not an official rackspace SDK and as such don't expect anyone to support it! (outside of this github). Unless you're messing around with experimental code, I highly recommend using nodejitsu's pkgcloud.

Feel free to issue pull requests :) Thanks!

- Seandon Mooy