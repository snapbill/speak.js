var id = 1;

var message = function(type, text, channel, session) {
  var self = this;

  self.id = id++;
  self.session = session;
  self.type = type;
  self.channel = channel;
  self.text = text;
  self.time = (new Date()).getTime();
}


exports.text = function(text, channel, session) {
  return new message('text', text, channel, session);
};
exports.join = function(text, channel, session) {
  return new message('join', text, channel, session);
};
exports.quit = function(text, channel, session) {
  return new message('quit', text, channel, session);
};
exports.timeout = function(channel, session) {
  return new message('timeout', undefined, channel, session);
};
