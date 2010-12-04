var config = require('./config'),
    message = require('./message');

var channels = {};

var channel = function(name) {
  var self = this;
  self.name = name;

  self.clients = [];
  self.sessions = {};
  self.messageHead = null;
  self.messageTail = null;

  self.garbageCollect = function() {
    // Remove all unclosed connections
    self.clients = self.clients.filter(function(client) {
      return client.closed == false;
    });

    // Remove messages older than
    var time = (new Date()).getTime();
    var expire = time - (config.get('messageExpire') || 30)*1000;

    while (self.messageHead && self.messageHead.time < expire) {
      self.messageHead = self.messageHead.next;
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
      self.sessions[session.id] = session;
      return true;
    }
  };
  self.removeSession = function(session, text) {
    if (text) {
      var msg = message.quit(text, self, session);
    }else{
      var msg = message.timeout(self, session);
    }
        
    self.addMessage(msg);
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
