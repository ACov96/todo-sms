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
    "number": <Number to text reminders to>,
    "twilioNumber": <Number to send messages from>,
    "port": <Port to serve on>
}
```

## Usage

You can run the server by running:

```bash
npm start
```

You can manage the to-do list by texting the following commands to your Twilio number (it is case-insensitive):

**ls**

List your items on your to-do list.

**rm**

Clear the list.

**+** ***item***

Add ***item*** to your list.

**-** ***item***

Remove ***item*** from your list if it exists in your list.

## Notifications

Right now, the app is hard-coded to send reminders every 2 hours between 10 AM - 10 PM. This is because that is usually when I'm most receptive to receiving notifications.
