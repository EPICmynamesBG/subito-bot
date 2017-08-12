'use strict';

require('dotenv').config({
  silent: true
});

const cron = require('node-cron');
const mysql = require('mysql');
const moment = require('moment');
const config = require('./config');
const logger = require('../api/helpers/logger');
const parseSubito = require('../api/helpers/parseSubito');
const soupCalendarService = require('../api/services/soupCalendarService');

const cronJob = (db) => {
  if (!db) {
    db = mysql.createConnection(config.DATABASE_URI);
    db.connect((err) => {
      if (!err) console.log('DB connected')
    });
  }
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

function initialize(db) {
  cron.schedule('0 0 0 * * Sunday', cronJob, true);
}

module.exports = {
  initialize: initialize,
  runNow: cronJob
};
