'use strict';

const cron = require('node-cron');
const config = require('./config/config');
const cronHelper = require('./api/helpers/cronHelper');

if (config.NODE_ENV === 'development' ||
   config.NODE_ENV === 'test') {
  require('pretty-error').start();
}

const db = require('./config/db');

const runOnStart = () => {
  cronHelper.processSubscribers(db)();
  // cronHelper.importCalendar(db)();
};

// Weekly, runs as midnight on Sundays
// cron.schedule('0 0 0 * * Sunday', cronHelper.importCalendar(db), true);

// Runs at every X minutes
cron.schedule(`0 */${60 / config.CRON_NOTIFICATION_CHECK} * * * *`,
  cronHelper.processSubscribers(db), true);

// Run now
runOnStart();
