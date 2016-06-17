/**
 * Created by rathawut on 5/27/16.
 */
const amqp = require('amqplib/callback_api');
const async = require('async');

const hapiAmqp = {
  register: function register(server, options, next) {
    const defaultQueueName = options.defaultQueueName;
    async.waterfall([
      async.apply(amqp.connect, `amqp://${options.user}:${options.password}@${options.host}`),
      (conn, callback) => {
        server.expose('connection', conn);
        conn.createChannel(callback);
      },
      (ch, callback) => {
        server.expose('channel', ch);
        ch.assertQueue(defaultQueueName, { durable: true });
        server.expose('send', (json) => {
          const msg = JSON.stringify(json);
          server.log(`Sending => ${msg}`);
          ch.sendToQueue(defaultQueueName, new Buffer(msg), { persistent: true });
        });
        callback();
      },
    ], next);
  },
};

hapiAmqp.register.attributes = {
  pkg: '../package.json',
};

module.exports = hapiAmqp;