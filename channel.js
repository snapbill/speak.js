var config = require('./config'),
    message = require('./message');

var channels = {};

var channel = function(name) {
  var self = this;
  self.name = name;

  self.clients = [];

  self.sessions = {};
  self.countSessions = 0;

  self.messageHead = null;
  self.messageTail = null;
  self.countMessages = 0;

  self.stats = function() {
    return {
      'clients': self.clients.length,
      'sessions': self.countSessions,
      'messages': self.countMessages
    };
  };
  self.garbageCollect = function() {
    // Remove all unclosed connections
    self.clients = self.clients.filter(function(client) {
      return client.closed == false;
    });

    // Remove messages older than
    var time = (new Date()).getTime();
    var expire = time - (config.get('messageExpire') || 30)*1000;

    while (self.messageHead && self.messageHead.time < expire) {
      self.messageHead.remove();
      self.messageHead = self.messageHead.next;
      self.countMessages--;
    }
    if (self.messageHead == null) self.messageTail = null;
  }

  self.addSession = function(session) {
    self.addMessage(message.join(
      session.introduction,
      self,
      session
    ));
    if (session.id in self.sessions) {
      return false;
    }else{
      self.countSessions++;
      self.sessions[session.id] = session;
      return true;
    }
  };
  self.removeSession = function(session, text) {
    if (!self.sessions[session.id]) return;

    if (text) {
      var msg = message.quit(text, self, session);
    }else{
      var msg = message.timeout(self, session);
    }
        
    self.addMessage(msg);
    self.countSessions--;
    delete self.sessions[session.id];
  }
  self.read = function(from_id) {
    var messages = [];

    // Include all session introductions with low from_id
    if (from_id < 1) {
      for (id in self.sessions) {
        messages.push(message.join(
          self.sessions[id].introduction,
          self,
          self.sessions[id]
        ));
      }
    }

    // Only check if there are messages >= from_id
    if (self.messageTail && self.messageTail.id >= from_id) {
      var message = self.messageHead;
      // Skip over any messages with too low id
      while (message && message.id < from_id) message = message.next;
      // Add all others to message list
      for (; message; message = message.next) messages.push(message);
    }

    return messages;
  }
  self.addMessage = function(message) {
    // Add it to the end
    if (!self.messageHead) {
      self.messageHead = message;
    }else{
      self.messageTail.next = message;
    }
    self.messageTail = message;
    message.next = null;
    self.countMessages++;

    // If we have any waiting clients, let them know
    self.clients.forEach(function(client) {
      if (!client.closed) client.reply_messages([message]);
    });
    self.clients = [];
  }

  self.addClient = function(client) {
    self.clients.push(client);
  }

}

exports.garbageCollect = function() {
  for (name in channels) {
    channels[name].garbageCollect();
    if (channels[name].clients.length == 0 && !channels[name].messageHead) {
      delete channels[name];
    }
  }
};

exports.open = function(name) {
  if (!channels[name]) channels[name] = new channel(name);
  return channels[name];
}

exports.stats = function() {
  var count = 0;
  var total = {};
  for (name in channels) {
    var stats = channels[name].stats();
    for (key in stats) {
      if (key in total) total[key] += stats[key];
      else total[key] = stats[key];
    }
    count++;
  }
  var message = "Channels: "+count+" open";

  if (count) {
    message += " with total of "+total['clients']+" clients, "+total['messages']+" messages, and "+total['sessions']+" sessions";
  }
  return message;
}
