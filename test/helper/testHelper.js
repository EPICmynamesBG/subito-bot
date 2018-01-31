'use strict';

require('dotenv').config({
  silent: true
});

const async = require('async');
const logger = require('../../api/helpers/logger');
const queryHelper = require('../../api/helpers/queryHelper');
const utils = require('../../api/helpers/utils');

const db = require('../../config/db');

const TABLES = [
  'oauth_integrations',
  'soup_calendar',
  'subscribers'
];

const TABLE_DATA = {
  soup_calendar: require('../data/SoupCalendar.json'),
  subscribers: require('../data/Subscribers.json'),
  oauth_integrations: require('../data/OauthIntegrations.json')
};

function clearData(done) {
  const fkChecks = 'SET foreign_key_checks = ?';
  const deleteQry = 'TRUNCATE TABLE ??';
  async.eachSeries(TABLES, (table, eachCb) => {
    db.query(`${fkChecks}; ${deleteQry}; ${fkChecks};`, [0, table, 1], eachCb);
  }, (err) => {
    if (err) logger.error('clearData', err);
    done(err);
  });
}

function resetData(done) {
  if (typeof done !== 'function') {
    logger.error('No callback provided');
  }
  async.waterfall([
    (cb) => {
      module.exports.clearData(cb);
    },
    (cb) => {
      async.eachSeries(TABLES, (table, eachCb) => {
        let data = TABLE_DATA[table];
        if (table === 'soup_calendar') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.day = Number.isInteger(clone.day) ?
              moment().add(clone.day, 'd').format('YYYY-MM-DD') :
              clone.day;
            return clone;
          });
        } else if (table === 'oauth_integrations') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.token = utils.encrypt(clone.token);
            clone.bot_token = utils.encrypt(clone.bot_token);
            return clone;
          });
        } else if (table === 'subscribers') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.timezone = JSON.stringify(clone.timezone);
            return clone;
          });
        }
        queryHelper.insert(db, table, data, eachCb);
      }, cb);
    }
  ], (err) => {
    if (err) logger.error('resetData', err);
    done(err);
  });
}


module.exports = {
  db: db,
  resetData: resetData,
  clearData: clearData
};
