const app = require('express')();
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { MessagingResponse } = require('twilio').twiml;
const scheduler = require('node-schedule');
const config = require('../config');

const messenger = twilio(config.sid, config.token);
const queue = new Set();

const library = {
  'ls': () => {
    let items = Array.from(queue);
    items = items.map((item) => `- ${item}`);
    return `You have the following items left to do:\n${items.join('\n')}`;
  },
  'rm': () => {
    queue.clear();
    return 'Cleared the queue.';
  },
  '+': (args) => {
    if (!args) return 'Nothing to add.';
    queue.add(args);
    return `Added ${args} to the queue.`;
  },
  '-': (args) => {
    if (!args) return 'Nothing to remove';
    queue.delete(args);
    return `Removed ${args} from the queue.`;
  },
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(`[${req.originalUrl}] Received command ${req.body.Body}`);
  next();
});

app.post(`/todo/receive`, (req, res) => {
  const reply = new MessagingResponse();
  const { Body } = req.body;
  const cmd = Body.split(' ');
  if (Object.prototype.hasOwnProperty.call(library, cmd[0].toLowerCase())) {
    reply.message(library[cmd[0].toLowerCase()](cmd.length ? cmd.slice(1).join(' ') : null));
  } else {
    reply.message(`Unknown command ${cmd[0].toLowerCase()}`);
  }
  res.send(reply.toString());
});

app.listen(config.port, () => console.log(`Listening on ${config.port}`));

scheduler.scheduleJob('0 10,12,14,16,18,20,22 * * *', () => {
  let items = Array.from(queue);
  if (items.length) {
    items = items.map(item => `- ${item}`);
    const message = `You have the following items left:\n${items.join('\n')}`;
    messenger.messages.create({
      body: message,
      to: `+1${config.number}`,
      from: `+1${config.twilioNumber}`,
    }).then(res.send()).done();
  }
});
