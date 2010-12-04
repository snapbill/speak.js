// includes  
var sys = require("sys"),  
    http = require("http"),  
    net = require("net"),  
    url = require("url"),  
    fs = require("fs"),  
    crypto = require("crypto"),
    config = require("./config"),
    client = require("./client").client;  
  

var keys = config.get('ssl');

// Load in the keys from file paths
for (k in keys) keys[k] = fs.readFileSync(keys[k]).toString();

// Create credentials for HTTPS
var credentials = crypto.createCredentials(keys);  


var createServer = function(options, clientHandler) {
  var server = http.createServer();

  // If we have SSL credentials add them
  if (options['credentials']) server.setSecure(options['credentials']);

  // Set up listener, and listen
  server.addListener('request', function (request, response) {
    var data = '';  
    request.addListener('data', function(chunk) { data += chunk; });  

    // When request is in
    request.addListener("end", function() {  
      var params = url.parse(request.url, true);

      clientHandler(new client(params['pathname'], params['query'] || {}, response));
    });  
  
  });
	console.log('Listen on '+options['host']+':'+options['port']);
  server.listen(options['port'], options['host']);
};

exports.listen = function(handler) {
	config.get('servers').forEach(function(server) {
		if (server['ssl']) server['credentials'] = credentials;
		createServer(server, handler);
	});
};
