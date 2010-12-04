var channels = {};

var channel = function(name) {
  var self = this;
  self.name = name;

  self.clients = [];
  self.messages = [];

  self.garbageCollect = function() {
    // Remove all unclosed connections
    self.clients = self.clients.filter(function(client) {
      return client.closed == false;
    });
  }

  self.read = function(from_id) {
    return self.messages.filter(function(message) {
      return message.id >= from_id;
    });
  }
  self.addMessage = function(message) {
    self.messages.push(message);

    self.clients.forEach(function(client) {
      if (!client.closed) client.reply_messages([message]);
    });
    self.clients = [];
  }

  self.addClient = function(client) {
    self.clients.push(client);
  }

}


exports.open = function(name) {
  if (!channels[name]) channels[name] = new channel(name);
  return channels[name];
}
