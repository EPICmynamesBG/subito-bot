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
  cronHelper.importCalendar(db)();
};

// Run first day of month, at midnight
cron.schedule('0 0 0 1 * *', cronHelper.importCalendar(db), true);

// Runs at set 15 minute intervals
cron.schedule('0 0,15,30,45 * * * *',
  cronHelper.processSubscribers(db), true);

// Run now
runOnStart();
