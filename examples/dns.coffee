
RacksJS = require '../dist/racks.js'

new RacksJS {
  username: process.argv[3]
  apiKey: process.argv[4]
  verbosity: 5
}, (rs) ->
	log = console.log

	# a list of all records on the domain:
	#rs.dns.assume('4181780').records.all (records) -> log records

	# adding a new domain:
	#rs.cloudDNS.domains.new [
	#	{
	#		"name": "somemadeupdomaindotcomlol.com",
	#		"emailAddress": "fake@somemadeupdomaindotcomlol.com"
	#		"ttl": 3600
	#	}
	#], (reply) ->
	#	console.log reply

	# adding some records:
	#rs.dns.assume('4181780').records.new [
	#	{
	#		name: 'test.somemadeupdomaindotcomlol.com'
	#		type: 'CNAME'
	#		data: 'erulabs.com'
	#		ttl: 300
	#	}
	#]