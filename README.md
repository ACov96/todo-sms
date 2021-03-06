# To-Do SMS

A small To-Do app that uses SMS to let me manage my to-do list and to notify me of items that I need to finish. Uses Twilio to manage SMS and Express to handle webhooks.

## Install

Clone the repo and install npm dependencies:

```bash
git clone git@github.com:ACov96/todo-sms.git
cd todo-sms
npm install
```

## Configuration

The app expects a `config.json` file in the root of the project:

```
{
    "token": <Twilio token>,
    "sid": <Twilio number SID>,
    "twilioNumber": <Number to send messages from>,
    "port": <Port to serve on>,
    "numbers": [
      {
        "number": <number to send messages to>,
        "recurrent": {
          <task>: <cron schedule>
        }
      }
    ]
}
```

`numbers` is an array of objects that contain information about the different numbers you want to allow access to the app. `number` is the number to text, `recurrent` is optional and can allow for recurring tasks to be automatically added. You just need to specifiy the name of the task `task` and the schedule using the standard crontab format.

## Usage

You can run the server by running:

```bash
npm start
```

You can manage the to-do list by texting the following commands to your Twilio number (it is case-insensitive):

#### ls

List your items on your to-do list.

#### rm

Clear the list.

#### + item, item, ...

Add ***item*** to your list. You can add multiple items by separating values with a ','.

#### - itemNumber, itemNumber, ...

Remove ***itemNumber*** from your list if it exists in your list. You can remove multiple items by separating values with a ','.

#### snooze

Delay the next notification by 1 cron cycle. This can compound.



## Notifications

Right now, the app is hard-coded to send reminders every 2 hours between 10 AM - 10 PM. This is because that is usually when I'm most receptive to receiving notifications.
