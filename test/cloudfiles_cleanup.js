#!/usr/bin/env node
// Include racks.js and start it with a few settings
new (require('../racks.js'))({
    username: process.argv[2], // mycloud.rackspace.com username
    apiKey: process.argv[3], // rackspace API KEY
    verbosity: 0, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
	if (rs.error) return rs.log(rs.error);
	filesWithServers = {};
	filesWithoutServers = [];
	var coorelateCalls = 0;
	coorelate = function () {
		if (++coorelateCalls < 2) {
			return false;
		}
		rs.cf.all(function (containers){ 
			containers.forEach(function (container) {
				if (container.name === "cloudservers") {
					container.listObjects(function (files) {	
						files.forEach(function (file) {
							if (file.substr(0, 5) === 'daily') {
								serverId = file.split('cloudserver')[1].split('.')[0];
								if (filesWithServers[serverId] === undefined) {
									filesWithoutServers.push(file);
								} else {
									filesWithServers[serverId].files.push(file);
								}
							}
						});
						filesWithoutServers.forEach(function (file) {
							console.log(file);
						});
					});
				}
			});
		});

	};
	rs.servers.all(function (servers) {
		servers.forEach(function (server){
			if (filesWithServers[server.id] === undefined) {
				filesWithServers[server.id] = { files: [] };
			}
			filesWithServers[server.id].name = server.name;
		});
		coorelate();
	});
	rs.cloudServers.servers.all(function (servers) {
		servers.forEach(function (server) {
			if (filesWithServers[server.id] === undefined) {
				filesWithServers[server.id] = { files: [] };
			}
			filesWithServers[server.id].name = server.name;
		});
		coorelate();
	});
});