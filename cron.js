'use strict';

require('dotenv').config({
  silent: true
});

const cron = require('node-cron');
const config = require('./config/config');
const cronHelper = require('./api/helpers/cronHelper');

if (config.NODE_ENV === 'development' ||
   config.NODE_ENV === 'test') {
  require('pretty-error').start();
}

const db = require('./config/db');

const runOnStart = () => {
  cronHelper.importCalendar(db)();
  cronHelper.processSubscribers(db)();
};

// Weekly, runs as midnight on Sundays 
cron.schedule('0 0 0 * * Sunday', cronHelper.importCalendar(db), true);

// Weekdays, runs at 10am
cron.schedule('0 0 10 * * 1-5', cronHelper.processSubscribers(db), true);

// Run now
runOnStart();
