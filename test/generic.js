#!/usr/bin/env node
// Include racks.js and start it with a few settings
new (require('../racks.js'))({
    username: process.argv[2], // mycloud.rackspace.com username
    apiKey: process.argv[3], // rackspace API KEY
    verbosity: 5, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
	// Log the error and stop if we fail to authenticate
	if (rs.error) return rs.log(rs.error);

	rs.cloudServersOpenStack.servers.all(function(servers){
		servers.forEach(function (server) {
			if (server.id === "SOME SERVER ID") {
				server.updateMetadata({
					rax_service_level_automation: 'Complete'
				}, function (reply) {
					console.log(reply);
					server.listMetadata(function (reply) {
						console.log(reply);
					});
				});
			}
		});
	});


	//rs.cloudDatabases.instances.all(function (all) {
	//	all.forEach(function (db) {
	//		if (db.id == '666d3dd6-8db1-40ed-a8c0-c7ce5628e379') {
	//			db.details(function (details) {
	//				console.log(details);
	//			});
	//		}
	//	});
	//});
	//rs.cloudServersOpenStack.servers.all(function(servers){
	//	console.log(servers);
	//	servers.forEach(function (server) {
	//		if (server.name === "SBE_PROD") {
	//			server.updateMetadata({
	//				rax_service_level_automation: 'Complete'
	//			}, function (reply) {
	//				console.log(reply);
	//				server.listMetadata(function (reply) {
	//					console.log(reply);
	//				});
	//			});
	//		}
	//	});
	//});
	//rs.cloudBlockStorage.volumes.all(function (volumes) {
	//	volumes.forEach(function (volume) {
	//		volume.show(function (details) {
	//			console.log(details);
	//		});
	//	});
	//});
	/* // shorthand for: RacksJS.cloudFiles.containers.all()
	rs.cf.all(function (containers){ 
		rs.log(containers);
	});
	*/
	//rs.cloudMonitoring.agents.all(function (agents) {
	//	console.log(agents);
	//});
	//rs.datacenter = 'DFW'
	//rs.cloudLoadBalancers.loadBalancers.all(function (reply) {
	//	reply.forEach(function (lb) {
	//		if (lb.name === 'ut-api-lb-https-01') {
	//			lb.details(function (reply) {
	//				console.log(reply);
	//			});
	//		}
	//	});
	//});
	//rs.servers.all(function (reply) {
	//	console.log(reply);
	//});
	//rs.cloudDNS.limits(function (reply) {
	//	console.log(reply);
	//});
});
