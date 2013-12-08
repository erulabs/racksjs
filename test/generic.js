#!/usr/bin/env node
var RacksJS = require('../racks.js');
new RacksJS({
	username: process.argv[2],
	apiKey: process.argv[3]
}, function (rack) {
	//Authentication error?
	if (rack.error) {
		return false;
	}
	// rack.PRODUCT.all (.where(), .find(), .create())
	rack.cloudServersOpenStack.servers.all(function (servers) {
        console.log(servers);
	});
});