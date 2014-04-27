Racks.js [![Build Status](https://travis-ci.org/erulabs/racksjs.png?branch=0.2)](https://travis-ci.org/erulabs/racksjs)
=======
__An unoffical javascript SDK for the Rackspace Cloud__

by Seandon Mooy with contributions from Matt Ellsworth

### About / News ###

Racksjs is mostly an attempt by the author to get intimate with the Rackspace API. It's also quite nice to script with - particularly because it doesn't invent any vocabulary - it simply wraps the rackspace api documentation as closely as possible.

Proper documentation and a lot more examples are soon to come - we're still missing a lot of functionality, but that too is on its way! For now, here is some example code:

### Usage ###
```html
// Include racks.js and start it with a few settings
new (require('../racks.js'))({
    username: 'Rackspace cloud username',
    apiKey: 'Rackspace cloud API KEY',
    verbosity: 1, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
    // Log the error and stop if we fail to authenticate
    if (rs.error) return rs.log(rs.error);

    // Get a list of all images:
    rs.cloudServersOpenStack.images.all( function( anArrayOfAllImages ) {
        ...
    });

    // Create a new server:
    rs.cloudServersOpenStack.servers.new({
      'name': 'racksjs_test',
      'flavorRef': 'performance1-1',
      'imageRef': 'f70ed7c7-b42e-4d77-83d8-40fa29825b85',
    }, function (server) {
        // Since servers aren't ready right away, you need to poll until they're complete
	// Racksjs provides helper functions for this:
        server.systemActive(function () {
            // systemAction fires once the server is fully built
            server.reboot();
        });
    });

    // You can find details about all the products and their resources by diving into
    // the RacksJS.products object. If you're familiar with docs.rackspace.com,
    // the "product.resource.action" concept shouldn't seem strange:
    //   rs.cloudServersOpenStack.servers
    //   rs.cloudLoadBalancers.loadBalancers
    //   rs.cloudFiles.containers
    //   and so on
    //
    // RacksJS provides shortcuts as wel: rs.servers, rs.clbs, rs.cf...
    // each "resource" (containers, servers) belongs to one "product" (cloudLoadBalancers)
    // and each resource has some common functionality: .all(), .find(), and sometimes .new().
    // there are often other, resource specific functions. (and sometimes product functions!)
    // read the docs, the racks.js code, or console.log(resource);
    // 
    // Below I will try to illistrate some example Racks.js code. For brand new stuff,
    // check tests/generic.js
    //
    //
    // shorthand for: RacksJS.cloudFiles.containers.all()
    rs.cf.all(function (containers){ 
        rs.log(containers);
    });
    // Do something to every OpenStack (NextGen) server
    // Keep in mind, rs.cloudServersOpenStack.servers is the same as rs.servers
    rs.cloudServersOpenStack.servers.all(function(servers){
        servers.forEach(function (server) {
            // These very closely match:
            // http://docs.rackspace.com/servers/api/v2/cs-devguide/content/Servers-d1e2073.html
            server.updateMetadata ...
            server.reboot ...
            // Method names are aimed at matching the documentation exactly:
            // http://docs.rackspace.com/servers/api/v2/cs-devguide/content/List_Addresses-d1e3014.html
            server.addresses ...
        });
    });
    // Many other resources live in various products. For instance:
    rs.cloudServersOpenStack.images.all(function (images) {});
    // When in doubt about the naming convention, the rackspace API documentation ought to help,
    // However, RackJS is incomplete. I recommend checking out our product catalog in racks.js:
    // RacksJS.prototype.buildCatalog() contains all product and resource information
});
```

### Important info ###
This repo is not an official rackspace SDK and as such don't expect anyone to support it! (outside of this github). Unless you're messing around with experimental code, I highly recommend using nodejitsu's pkgcloud.

Feel free to issue pull requests :) Thanks!

- Seandon Mooy
