exports.client = function(url, param, response) {  
  var self = this;

  self.closed = false;
  self.url = url;
  self.param = param;
  self.response = response;

  self.close = function() {
    self.closed = true;
  }
  self.reply_base64 = function(data, content_type) {
    self.closed = true;
    if (!content_type) content_type = 'application/octet-stream';

    var buff = new Buffer(data, 'base64');
    response.writeHead(200, {'Content-Type': content_type});
    response.write(buff);
    response.end();
  };
  self.reply = function(obj) {
    self.closed = true;

    response.writeHead(200, {'Content-Type': 'application/javascript'});

    if ('aux' in self.param) obj['aux'] = self.param['aux'];

    if ('callback' in self.param) response.write(self.param['callback']+'(');

    response.write(JSON.stringify(obj));

    if ('callback' in self.param) response.write(');');

    response.end();
  };
  self.reply_messages = function(messages) {
    var last_id = 0;
    messages = messages.map(function(message) {
      if (message.id > last_id) last_id = message.id;
      return {
        'message': message.text,
        'channel': message.channel.name,
        'session': message.session ? message.session.id : undefined,
        'type': message.type,
        'time': message.time};
      });
    return self.reply({'messages':messages, 'last_id': last_id});
  };
};  

