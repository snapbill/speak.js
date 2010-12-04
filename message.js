var id = 1;

exports.message = function(text, channel) {
  var self = this;

  self.id = id++;
  self.channel = channel;
  self.text = text;
  self.time = (new Date()).getTime();
}
