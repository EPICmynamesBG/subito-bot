'use strict';

require('dotenv').config({
  silent: true
});

const cron = require('node-cron');
const moment = require('moment');
const config = require('./config/config');
const logger = require('./api/helpers/logger');
const parseSubito = require('./api/helpers/parseSubito');
const soupCalendarService = require('./api/services/soupCalendarService');

if (config.NODE_ENV === 'development' ||
   config.NODE_ENV === 'test') {
  require('pretty-error').start();
}

const db = require('./config/db');

const cronJob = () => {
  logger.info('Running Cron:: ', moment().toDate());
  parseSubito.fetchCalendar((err, data) => {
    if (err) {
      logger.error(err);
      return;
    }
    soupCalendarService.massUpdate(db, data, (err, updated) => {
      logger.debug('Update complete', updated);
    });
  });
};


cron.schedule('0 0 0 * * Sunday', cronJob, true);

// Run now
cronJob();

