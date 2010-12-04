#!/usr/local/bin/node
var server = require('./server'),
    message = require('./message'),
    session = require('./session'),
    config = require("./config"),
    channel = require('./channel');

var write = function(param, response) {

}

setInterval(function() {
  session.garbageCollect();
  channel.garbageCollect();
}, (config.get('garbageCollection') || 20)*1000);


server.listen(function(client) {
  // Open the session if we can
  var current = null;
  if (client.param['session']) {
    current = session.find(client.param['session']);
    if (!current) return client.reply({'result':'Session expired'});
    if (client.param['auth'] != current.auth) return client.reply({'result':'Authentication incorrect'});

    current.ping();
  }

  if (client.url == '/write') {
    if (!client.param['message']) return client.reply({'result':'Include a message to write'});
    if (!client.param['channel']) return client.reply({'result':'Include a channel to write'});

    var to = channel.open(client.param['channel']);
    to.addMessage(message.text(
      client.param['message'],
      to,
      current
    ));

    return client.reply({'result': 'ok'});
  }else if (client.url == '/read') {
    if (!client.param['channel']) return client.reply({'result':'Include atleast one channel to read from'});

    var channels = client.param['channel'];
    if (typeof(channels) == 'string') channels = [channels];

    channels = channels.map(channel.open);

    var messages = [];

    channels.forEach(function(channel) {
      channel.read(client.param['from_id'] || 1).forEach(function(message) {
        messages.push(message);
      });
    });

    if (messages.length) {
      return client.reply_messages(messages);
    }else{
      channels.forEach(function(channel) {
        channel.addClient(client);
      });
    }

    // Exit after timeout if one is provided
    if (client.param['timeout']) {
      setTimeout(function() {
        if (!client.closed) client.reply_messages([]);
      }, client.param['timeout']);
    }
  }else if (client.url == '/connect') {
    if (!client.param['introduction']) return client.reply({'result':'Include an introduction.'});

    var current = new session.open(client.param['introduction']);

    client.reply({'result': 'ok', 'id':current.id, 'auth': current.auth});
  }else if (client.url == '/join') {
    if (!client.param['channel']) return client.reply({'result':'Include atleast one channel to join'});
    if (!current) return client.reply({'result':'You can only join channels with an active session.'});

    var channels = client.param['channel'];
    if (typeof(channels) == 'string') channels = [channels];

    channels.forEach(function(name) {
      current.join(channel.open(name));
    });
    
    client.reply({'result': 'ok'});
  }else{
    return client.reply({"result":"Correct commands on /read, /write, /introduce, /test and /create"});
  }
});
