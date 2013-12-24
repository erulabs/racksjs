# Racks.js
### a javascript SDK for the Rackspace Cloud
by Seandon Mooy with contributions from Matt Ellsworth

### About / News

Racksjs is mostly an attempt by the author to get intimate with the Rackspace API. It's also quite nice to script with - particularly because it doesn't invent any vocabulary - it simply wraps the rackspace api documentation as closely as possible.

Proper documentation and a lot more examples are soon to come - we're still missing a lot of functionality, but that too is on its way! For now, here is some example code:

### Usage
    // Include racks.js and start it with a few settings
    new (require('../racks.js'))({
        username: process.argv[2], // mycloud.rackspace.com username
        apiKey: process.argv[3], // rackspace API KEY
        verbosity: 1, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
        cache: true // Defaults to false - cache authentication in file
    }, function (rs) {
        // Log the error and stop if we fail to authenticate
        if (rs.error) return rs.log(rs.error);
        //
        //
        /* // shorthand for: RacksJS.cloudFiles.containers.all()
        rs.cf.all(function (containers){ 
            rs.log(containers);
        });
        */
    });

### Important info
This repo is not an official rackspace SDK and as such don't expect anyone to support it! (outside of this github). Unless you're messing around with experimental code, I highly recommend using nodejitsu's pkgcloud.

Feel free to issue pull requests :) Thanks!

- Seandon Mooy