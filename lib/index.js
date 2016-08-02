/**
 * Created by rathawut on 5/27/16.
 */
const amqp = require('amqplib/callback_api');
const async = require('async');
const pkg = require('../package.json');

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
        server.expose('send', (json, options = {}) => {
          const msg = JSON.stringify(json);
          let queueName = options.queueName || defaultQueueName;
          if (options.prefixQueueName) {
            queueName = options.prefixQueueName + queueName;
          }
          if (options.suffixQueueName) {
            queueName = queueName + options.suffixQueueName;
          }
          server.log(`Sending => ${msg}`);
          ch.sendToQueue(queueName, new Buffer(msg), { persistent: true });
        });
        callback();
      },
    ], next);
  },
};

hapiAmqp.register.attributes = {
  pkg,
};

module.exports = hapiAmqp;
