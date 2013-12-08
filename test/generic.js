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
    rack.cloudLoadBalancers.limits.all(function (limits) {
        console.log(limits);
    });
    rack.cloudServersOpenStack.servers.all(function (servers) {
        console.log(servers);
    });
});