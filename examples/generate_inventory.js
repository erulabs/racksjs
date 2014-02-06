#!/usr/bin/env node
// Include racks.js and start it with a few settings
new (require('../racks.js'))({
	username: process.argv[2], // mycloud.rackspace.com username
	apiKey: process.argv[3], // rackspace API KEY
	verbosity: 0, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
	if (rs.error) return rs.log(rs.error);
	var sys = require('sys'),
		exec = require('child_process').exec,
		// Assume ~/.cloud_control_cookies (http://theracker.turnbasedaction.com/cloud/c)
		// THIS IS RACKER ONLY FUNCTIONALITY, AND AS SUCH WILL NEVER WORK FOR NONRACKERS
		getPassword = function (servertype, serverid, callback) {
			exec("curl --insecure -i -L -s -b ~/.cloud_control_cookies http://us.cloudcontrol.rackspacecloud.com/customer/"+rs.access.token.tenant.id+"/users/"+rs.access.user.id+"/"+servertype+"/"+serverid+"/managed_admin_passwords | grep 'admin_password' | awk -F'\"' '{print $4}';", function (error, stdout, stderr) {
				callback(stdout.replace(/(\r\n|\n|\r)/gm,""));
			});
		},
		// todo: configurable via cli option
		outformat = 'sshpass',
		target = 'private', // Must be one of "public" or "private"
		user = 'rack',
		o = console.log,
		outputters = {
			// Generates a salt roster - move the output to /etc/salt/master and away you go!
			'salt': function (server) {
				o(server.name + ":");
				o('  host:', server.ip);
				o('  user:', user);
				o('  passwd:', '"'+server.passwd+'"');
				o("  sudo: True\n");
			},
			// For raw SSH - requires you install "sshpass" on the calling server. Good for very old stuff.
			'sshpass': function (server) {
				var reply = 'sshpass -p\''+server.passwd+'\' ';
				reply = reply + 'ssh -o StrictHostKeyChecking=no ';
				reply = reply + user + '@' + server.ip
				reply = reply + ' -t "echo \'$1\'"'
				o(reply);
			}
 		};

	rs.cloudServers.servers.all(function (firstGenServers) {
		rs.cloudServersOpenStack.servers.all(function(nextGenServers){
			var servers = firstGenServers.concat(nextGenServers);
			servers.forEach(function (server) {
				server.addresses(function (reply) {
					reply.addresses[target].forEach(function (addr) {
						if (typeof addr === "string") {
							var ip = addr;
						} else {
							if (addr.version === 4) {
								var ip = addr.addr;
							}
						}
						if (ip !== undefined) {
							server.ip = ip;
							if (server._racksmeta.product === 'cloudServersOpenStack') {
								var region = server.links[0].href.substr(8).split('.')[0].toUpperCase()
								var productURL = 'next_gen_servers/' + region;
							} else {
								var productURL = 'first_gen_servers';
							}
							getPassword(productURL + '/', server.id, function (passwd) {
								server.passwd = passwd
								outputters[outformat](server);
							});
						}
					});
				});
			});
		});
	});
});
