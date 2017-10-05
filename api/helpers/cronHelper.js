'use strict';

const async = require('async');
const moment = require('moment');

const logger = require('./logger');
const parseSubito = require('./parseSubito');
const utils = require('./utils');
const slack = require('./slack');
const soupCalendarService = require('../services/soupCalendarService');
const soupCalendarViewService = require('../services/soupCalendarViewService');
const integrationSubscriberViewService = require('../services/integrationSubscriberViewService');

const importCalendar = (db) => {
  return (cb) => {
    logger.info('Running importCalendar:: ', moment().format());
    parseSubito.fetchCalendar((err, data) => {
      if (err) {
        logger.error(err);
        if (typeof cb === 'function') cb(err);
        return;
      }
      soupCalendarService.massUpdate(db, data, (err2, updated) => {
        logger.info('importCalendar complete:: ', updated);
        if (typeof cb === 'function') cb(err2, updated);
      });
    });
  };
};

const processSubscribers = (db) => {
  return (callback) => {
    logger.info('Running processSubscribers:: ', moment().toDate());
    const cleanExit = { clean: true };
    async.autoInject({
      soups: (cb) => {
        soupCalendarViewService.getSoupsForDay(db, utils.dateForText('today'), cb);
      },
      subscribers: (cb) => {
        integrationSubscriberViewService.getAll(db, true, cb);
      },
      process: (soups, subscribers, cb) => {
        if (!soups) {
          cb(cleanExit);
          return;
        }
        async.each(subscribers, (subscriber, eachCb) => {
          slack.messageUser(subscriber.slack_username, soups.text, subscriber.slack_webhook_url, (err, res) => {
            if (err || res.status === 'fail') logger.error(subscriber, err, res);
            eachCb();
          });
        }, cb);
      }
    }, (err) => {
      if (err && err.clean) {
        logger.info('processSubscribers complete', 'no soups for today');
      } else if (err) {
        logger.error(err); // should never occur
      } else {
        logger.info('processSubscribers complete');
      }
      if (typeof callback === 'function') callback(err);
    });
  };
};

module.exports = {
  importCalendar: importCalendar,
  processSubscribers: processSubscribers
};
