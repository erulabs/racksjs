#!/usr/bin/env node
// Include racks.js and start it with a few settings
new (require('../racks.js'))({
    username: process.argv[2], // mycloud.rackspace.com username
    apiKey: process.argv[3], // rackspace API KEY
    verbosity: 0, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
	// Log the error and stop if we fail to authenticate
	if (rs.error) return rs.log(rs.error);

	//var date = 'jan-01-2014'
	//rs.cloudServers.servers.all(function (servers) {
	//	servers.forEach(function (server) {
	//		server.addresses(function (reply) {
	//			var imageName = date + ' ' + server.name + ' ' + reply.addresses.public[0];
	//			console.log('creating image,', imageName, 'for server id:', server.id);
	//			rs.cloudServers.createImage({
	//				name: imageName,
	//				serverId: server.id
	//			}, function (reply) {
	//				console.log(reply);
	//			});
	//		});
	//	});
	//});
	rs.cloudServers.servers.all(function (firstGenServers) {
		rs.cloudServersOpenStack.servers.all(function(nextGenServers){
			var servers = firstGenServers.concat(nextGenServers);
			servers.forEach(function (server) {
				server.addresses(function (reply) {
					reply.addresses.public.forEach(function (addr) {
						if (typeof addr === "string") {
							var ip = addr;
						} else {
							if (addr.version === 4) {
								var ip = addr.addr;
							}
						}
						console.log(server.name, "\t\tansible_ssh_host="+ip, "\tansible_ssh_user=rack\tansible_ssh_pass=");
					});
				});
			});
		});
	});
});