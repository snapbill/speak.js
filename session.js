var config = require('./config');

var sessions = {};

var next_id = 1;

var session = function(id, introduction) {
  var self = this;
  self.id = id;
  self.closed = false;
  self.auth = 0; //Math.floor(Math.random()*99999999);
  self.introduction = introduction;
  self.channels = [];

  self.join = function(channel) {
    if (channel.addSession(self)) {
      self.channels.push(channel);
    }
  };

  self.ping = function() {
    self.expire = (new Date()).getTime() + (config.get('sessionTimeout')||30)*1000;
  };

  self.timeout = function() {
    self.channels.forEach(function(channel) {
      channel.removeSession(self, 'Connection timed out.');
    });
    self.closed = true;
  }

  self.ping();
}

exports.garbageCollect = function() {
  var time = (new Date()).getTime();
  for (id in sessions) {
    if (time > sessions[id].expire) {
      sessions[id].timeout();
      delete sessions[id];
    }
  }
};

exports.open = function(introduction) {
  sessions[next_id] = new session(next_id, introduction);
  return sessions[next_id++];
}

exports.find = function(id) {
  return sessions[id];
}

