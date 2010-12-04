#!/usr/local/bin/node
var server = require('./server'),
    message = require('./message'),
    config = require("./config"),
    channel = require('./channel');

var write = function(param, response) {

}

setInterval(function() {
  channel.garbageCollect();
}, (config.get('garbageCollection') || 20)*1000);


server.listen(function(client) {
  if (client.url == '/write') {
    if (!client.param['message']) return client.reply({'result':'Include a message to write'});
    if (!client.param['channel']) return client.reply({'result':'Include a channel to write'});

    var to = channel.open(client.param['channel']);
    var msg = new message.message(client.param['message'], to.name);

    to.addMessage(msg);

    return client.reply({'result': 'ok'});
  }else if (client.url == '/read') {
    if (!client.param['channel']) return client.reply({'result':'Include atleast one channel to read from'});

    var channels = client.param['channel'];
    if (typeof(channels) == 'string') channels = [channels];

    channels = channels.map(channel.open);

    var messages = [];

    if (client.param['from_id'] != undefined) {
      channels.forEach(function(channel) {
        channel.read(client.param['from_id']).forEach(function(message) {
          messages.push(message);
        });
      });
    }

    if (messages.length) {
      return client.reply_messages(messages);
    }else{
      channels.forEach(function(channel) {
        channel.addClient(client);
      });
    }
  }else{
    return client.reply({"result":"Correct commands on /read, /write, /introduce, /test and /create"});
  }
});
