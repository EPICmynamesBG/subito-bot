'use strict';

require('dotenv').config({
  silent: true
});

const moment = require('moment');
const async = require('async');
const logger = require('../../api/helpers/logger');
const queryHelper = require('../../api/helpers/queryHelper');
const utils = require('../../api/helpers/utils');

const db = require('../../config/db');

const TABLES = [
  'oauth_integrations',
  'team_integrations',
  'soup_calendar',
  'subscribers'
];

const TABLE_DATA = {
  soup_calendar: require('../data/SoupCalendar.json'),
  subscribers: require('../data/Subscribers.json'),
  team_integrations: require('../data/TeamIntegrations.json')
};

function clearData(callback) {
  const fkChecks = 'SET foreign_key_checks = ?';
  const deleteQry = 'TRUNCATE TABLE ??';
  async.each(TABLES, (table, eachCb) => {
    db.query(`${fkChecks}; ${deleteQry}; ${fkChecks};`, [0, table, 1], eachCb);
  }, (err) => {
    if (err) logger.error('clearData', err);
    callback();
  });
}

function resetData(callback) {
  if (typeof callback !== 'function') {
    logger.error('No callback provided');
  }
  async.waterfall([
    (cb) => {
      module.exports.clearData(cb);
    },
    (cb) => {
      async.each(TABLES, (table, eachCb) => {
        let data = TABLE_DATA[table];
        if (table === 'soup_calendar') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.day = Number.isInteger(clone.day) ?
              moment().add(clone.day, 'd').format('YYYY-MM-DD') :
              clone.day;
            return clone;
          });
        } else if (table === 'team_integrations') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.slack_slash_token = utils.encrypt(clone.slack_slash_token);
            clone.slack_webhook_url = utils.encrypt(clone.slack_webhook_url);
            if (clone.metadata) {
              clone.metadata = utils.encrypt(clone.metadata);
            }
            return clone;
          });
        } else if (table === 'oauth_integrations') {
          data = data.map((entry) => {
            let clone = Object.assign({}, entry);
            clone.token = utils.encrypt(clone.token);
            return clone;
          });
        }
        queryHelper.insert(db, table, data, eachCb);
      }, cb);
    }
  ], (err) => {
    if (err) logger.error('resetData', err);
    callback();
  });
}


module.exports = {
  db: db,
  resetData: resetData,
  clearData: clearData
};
