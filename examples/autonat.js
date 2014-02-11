new (require('../racks.js'))({
    username: process.argv[2], // mycloud.rackspace.com username
    apiKey: process.argv[3], // rackspace API KEY
    verbosity: 5, // 0 - 5, 0 is no output, 1 is script only (rs.log), 5 is debug.
}, function (rs) {
	if (rs.error) return rs.log(rs.error);

	rs.servers.new({
		name: 'Some servr',
		flavorRef: 'performance1-4',
		imageRef: '',
		metadata: {
			'RackConnectPublicIP': '0.0.0.0'
		},
	}, function (reply) {
		console.log(reply);
	});

});
