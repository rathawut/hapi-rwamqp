/**
 * Created by rathawut on 5/27/16.
 */
const amqp = require('amqplib/callback_api');
const async = require('async');
const pkg = require('../package.json');

const hapiAmqp = {
  register: function register(server, options, next) {
    const defaultQueueName = options.defaultQueueName;
    const url = `amqp://${options.user}:${options.password}@${options.host}`;
    async.waterfall([
      async.apply(amqp.connect, url),
      (conn, callback) => {
        server.expose('connection', conn);
        conn.createChannel(callback);
      },
      (ch, callback) => {
        server.expose('channel', ch);
        server.expose('send', (json, sendOptions = {}) => {
          const msg = JSON.stringify(json);
          let queueName = sendOptions.queueName || defaultQueueName;
          if (sendOptions.prefixQueueName) {
            queueName = sendOptions.prefixQueueName + queueName;
          }
          if (sendOptions.suffixQueueName) {
            queueName = queueName + sendOptions.suffixQueueName;
          }
          server.log(`Sending => ${msg} to ${queueName}`);
          ch.assertQueue(queueName, { durable: true });
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
