'use strict';

require('dotenv').config({
  silent: true
});

const moment = require('moment');
const async = require('async');
const config = require('../../config/config');
const logger = require('../../api/helpers/logger');

const db = require('../../config/db');

const TABLES = [
  'soup_calendar',
  'subscribers'
];

const TABLE_COLUMN_MAP = {
  soup_calendar: ['id', 'day', 'soup'],
  subscribers: ['id', 'slack_user_id', 'slack_username']
};

const TABLE_DATA = {
  soup_calendar: require('../data/SoupCalendar.json'),
  subscribers: require('../data/Subscribers.json')
};

function clearData(callback) {
  const deleteQry = 'DELETE FROM ?';
  async.each(TABLES, (table, eachCb) => {
    db.query(deleteQry, [table], eachCb);
  }, (err) => {
    if (err) logger.error(err);
    callback();
  });
}

function resetData(callback) {
  if (typeof callback !== 'function') {
    logger.error('No callback provided');
  }
  const deleteQry = 'DELETE FROM ??';
  const insertQry = 'INSERT INTO ?? (??) VALUES ?';
  async.waterfall([
    (cb) => {
      async.each(TABLES, (table, eachCb) => {
        db.query(deleteQry, [table], eachCb);
      }, cb);
    },
    (cb) => {
      async.each(TABLES, (table, eachCb) => {
        const dataMap = TABLE_DATA[table].map((entry) => {
          return TABLE_COLUMN_MAP[table].map((column) => {
            if (table === 'soup_calendar'
                && column === 'day') {
              
              return Number.isInteger(entry[column]) ?
                moment().add(entry[column], 'd').format('YYYY-MM-DD') :
                                   entry[column];
            }
            return entry[column];
          });
        });
        db.query(insertQry, [table, TABLE_COLUMN_MAP[table], dataMap], eachCb);
      }, cb);
    }
  ], (err) => {
    if (err) logger.error(err);
    callback();
  });
}


module.exports = {
  db: db,
  resetData: resetData,
  clearData: clearData
};
