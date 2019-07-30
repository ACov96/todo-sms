const app = require('express')();
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { MessagingResponse } = require('twilio').twiml;
const scheduler = require('node-schedule');
const fs = require('fs');
const config = require('../config');

const allNumbers = config.numbers.map(num => num.number);
const messenger = twilio(config.sid, config.token);
let queue = {};
config.numbers.forEach((num) => {
  queue[num.number] = {
    snooze: 0,
    list: new Set(),
  };
});
let snooze = 0;

if (fs.existsSync('./queue-backup.json')) {
  const backup = fs.readFileSync('./queue-backup.json', 'utf8');
  const backupObj = JSON.parse(backup);
  queue = {};
  Object.keys(backupObj).forEach((num) => {
    queue[num] = {};
    queue[num].number = num;
    queue[num].list = new Set(backupObj[num].list);
  });
}

const library = {
  'ls': (_, num) => {
    const cur = queue[num];
    let items = Array.from(cur.list);
    if (items.length === 0) return 'You have nothing left in the queue'
    items = items.map((item, idx) => `${idx+1}. ${item}`);
    return `You have the following items left to do:\n${items.join('\n')}`;
  },
  'rm': (_, num) => {
    const cur = queue[num];
    cur.list.clear();
    return 'Cleared the queue.';
  },
  '+': (args, num) => {
    if (!args) return 'Nothing to add.';
    const cur = queue[num];
    args.split(',').forEach(arg => cur.list.add(arg.trim()));
    return `Added ${args} to the queue.`;
  },
  '-': (args, num) => {
    if (!args) return 'Nothing to remove';
    const cur = queue[num];
    items = Array.from(cur.list);
    const removed = [];
    args.split(',').forEach((arg) => {
      removed.push(items[Number(arg)-1]);
      cur.list.delete(items[Number(arg)-1]);  
    });
    return `Removed ${removed.join(', ')} from the queue.`;
  },
  'snooze': (_, num) => {
    const cur = queue[num];
    cur.snooze++;
    return `Current snooze value: ${cur.snooze}`;
  }
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
  const { Body, From } = req.body;
  const cmd = Body.split(' ');
    if (Object.prototype.hasOwnProperty.call(library, cmd[0].toLowerCase())) {
      reply.message(library[cmd[0].toLowerCase()](cmd.length ? cmd.slice(1).join(' ') : null, From.substr(2)));
    } else {
      reply.message(`Unknown command ${cmd[0].toLowerCase()}`);
    }
    res.send(reply.toString()); 
});

app.listen(config.port, () => console.log(`Listening on ${config.port}`));

// Automatic text 
scheduler.scheduleJob('0 10-22/2 * * *', () => {
  allNumbers.forEach((num) => {
    const cur = queue[num];
    if (cur.snooze > 0) {
      cur.snooze--;
      return;
    }
    let items = Array.from(cur.list);
    if (items.length) {
      items = items.map((item, idx) => `${idx+1}. ${item}`);
      const message = `You have the following items left:\n${items.join('\n')}`;
      messenger.messages.create({
        body: message,
        to: `+1${num}`,
        from: `+1${config.twilioNumber}`,
      }).then(() => console.log('Sent scheduled SMS reminder')).done();
    }  
  });
});

// Load recurrent tasks
config.numbers.forEach((num) => {
  if (num.recurrent) {
    Object.keys(num.recurrent).forEach((task) => {
      scheduler.scheduleJob(num.recurrent[task], () => queue[num.number].list.add(task));
    });
  }
});

// Save in-memory list to disk in case of restart
setInterval(() => {
  const jsonQueue = {};
  Object.keys(queue).forEach((num) => {
    const obj = {}
    obj.number = num;
    obj.list = Array.from(queue[num].list);
    jsonQueue[num] = obj;
  });
  fs.writeFileSync('./queue-backup.json', JSON.stringify(jsonQueue));
}, 30000);
