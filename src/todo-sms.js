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
    if (items.length === 0) return 'You have nothing left in the queue'
    items = items.map((item, idx) => `${idx+1}. ${item}`);
    return `You have the following items left to do:\n${items.join('\n')}`;
  },
  'rm': () => {
    queue.clear();
    return 'Cleared the queue.';
  },
  '+': (args) => {
    if (!args) return 'Nothing to add.';
    args.split(',').forEach(arg => queue.add(arg.trim()));
    return `Added ${args} to the queue.`;
  },
  '-': (args) => {
    if (!args) return 'Nothing to remove';
    items = Array.from(queue);
    const removed = [];
    args.split(',').forEach((arg) => {
      removed.push(items[Number(arg)-1]);
      queue.delete(items[Number(arg)-1]);  
    });
    return `Removed ${removed.join(', ')} from the queue.`;
  },
};

// Setup HTTP server
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

// Automatic text 
scheduler.scheduleJob('0 10-22/2 * * *', () => {
  let items = Array.from(queue);
  if (items.length) {
    items = items.map((item, idx) => `${idx+1}. ${item}`);
    const message = `You have the following items left:\n${items.join('\n')}`;
    messenger.messages.create({
      body: message,
      to: `+1${config.number}`,
      from: `+1${config.twilioNumber}`,
    }).then(() => console.log('Sent scheduled SMS reminder')).done();
  }
});

// Load recurrent tasks
if (config.recurrent) {
  Object.keys(config.recurrent).forEach((task) => {
    scheduler.scheduleJob(config.recurrent[task], () => queue.add(task));
  });
}
