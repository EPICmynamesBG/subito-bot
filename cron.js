'use strict';

require('dotenv').config({ silent: true });

const cron = require('node-cron');
const mysql = require('mysql');
const moment = require('moment');
const config = require('./config/config');
const logger = require('./api/helpers/logger');
const parseSubito = require('./api/helpers/parseSubito');
const soupCalendarService = require('./api/services/soupCalendarService');

const db = mysql.createConnection(config.DATABASE_URI);

db.connect((err) => { if (!err) console.log('DB connected')});

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

const task = cron.schedule('0 0 0 * * Sunday', cronJob, true);

// Run now
cronJob();
