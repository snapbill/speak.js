// includes  
var sys = require("sys"),  
    http = require("http"),  
    net = require("net"),  
    url = require("url"),  
    fs = require("fs"),  
    crypto = require("crypto"),
    client = require("./client").client;  
  

var keys = {
  'key':   '/www/snapbill/keys/ssl.key/snapbill.com.key',
  'cert':  '/www/snapbill/keys/ssl.key/snapbill.com.crt',
  'ca':    '/www/snapbill/keys/ssl.key/DigiCertCA.crt'
};

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
  server.listen(options['port']);
};

exports.listen = function(port, handler) { createServer({'port': port}, handler); }
exports.listenSSL = function(port, handler) { createServer({'port': port,  'credentials': credentials}, handler); }
