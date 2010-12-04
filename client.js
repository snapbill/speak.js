exports.client = function(url, param, response) {  
  var self = this;

  self.closed = false;
  self.url = url;
  self.param = param;
  self.response = response;

  self.reply = function(obj) {
    response.writeHead(200, {'Content-Type': 'text/plain'});

    if ('aux' in self.param) obj['aux'] = self.param['aux'];

    if ('callback' in self.param) response.write(self.param['callback']+'(');

    response.write(JSON.stringify(obj));

    if ('callback' in self.param) response.write(');');

    response.end();
    self.closed = true;
  };


  self.reply_messages = function(messages) {
    var last_id = 0;
    messages = messages.map(function(message) {
      if (message.id > last_id) last_id = message.id;
      return {
        'message': message.text,
        'channel': message.channel,
        'type': 'message',
        'time': message.time};
      });
    return self.reply({'messages':messages, 'last_id': last_id});
  };
};  

