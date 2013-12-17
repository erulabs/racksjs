#!/usr/bin/env node
// Include racks.js
var RacksJS = require('../rerack.js');
new RacksJS({
    // Username and APIKEY for rackspace
    username: process.argv[2],
    apiKey: process.argv[3],
    verbosity: 4
}, function (rack) {
	if (rack.error) {
		return console.log(rack.error);
	}
	rack.products.cloudServersOpenStack.servers.all(function (servers) {
		console.log(servers);
	});
});
