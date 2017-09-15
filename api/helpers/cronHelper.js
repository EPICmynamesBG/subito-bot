'use strict';

const async = require('async');
const moment = require('moment');

const logger = require('./logger');
const parseSubito = require('./parseSubito');
const utils = require('./utils');
const slack = require('./slack');
const soupCalendarViewService = require('../services/soupCalendarViewService');
const subscriberService = require('../services/subscriberService');

const importCalendar = (db) => {
  return () => {
    logger.info('Running importCalendar:: ', moment().format());
    parseSubito.fetchCalendar((err, data) => {
      if (err) {
        logger.error(err);
        return;
      }
      soupCalendarViewService.massUpdate(db, data, (err, updated) => {
        logger.info('importCalendar complete:: ', updated);
      });
    });
  };
};

const processSubscribers = (db) => {
  return () => {
    logger.info('Running processSubscribers:: ', moment().toDate());
    const cleanExit = { clean: true };
    let soups;
    async.waterfall([
      (cb) => {
        soupCalendarViewService.getSoupsForDay(db, utils.dateForText('today'), cb);
      },
      (soupCal, cb) => {
        if (!soupCal) {
          cb(cleanExit);
          return;
        }
        soups = soupCal;
        subscriberService.getSubscribers(db, cb);
      },
      (subscribers, cb) => {
        async.each(subscribers, (subscriber, cb2) => {
          slack.messageUser(subscriber.slack_username, soups.text, (err, res) => {
            if (err || res.status === 'fail') logger.error(subscriber, err, res);
            cb2();
          });
        }, cb);
      }
    ], (err) => {
      if (err && err.clean) {
        logger.info('processSubscribers complete: no soups for today:: ', moment().format());
      } else if (err) {
        logger.error(err); // should never occur
      } else {
        logger.info('processSubscribers complete:: ', moment().format());
      }
    });
  };
};

module.exports = {
  importCalendar: importCalendar,
  processSubscribers: processSubscribers
};
