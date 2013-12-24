#!/usr/bin/env node
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