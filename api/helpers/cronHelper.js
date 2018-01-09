'use strict';

const async = require('async');
const lodash = require('lodash');
const moment = require('moment-timezone');
const { DEFAULT_TIMEZONE } = require('../../config/config');

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

const _buildCustomText = (searchStr, soups) => {
  return `Today's the day! _${searchStr}_ is on the menu! Here are the soups: \n>${soups[0]}\n>${soups[1]}`;
};

const _isTimeToNotify = (subscriber) => {
  const timezone = lodash.get(subscriber, 'timezone.tz', DEFAULT_TIMEZONE);
  const notifyTime = moment(subscriber.notify_time, 'HH:mm:ss').tz(timezone);
  const lowerTime = moment().tz(timezone).subtract('7.5', 'minute');
  const upperTime = moment().tz(timezone).add('7.5', 'minute');

  return notifyTime.isBetween(lowerTime, upperTime);
};

const _processSubscriber = (db, subscriber, soups, callback) => {
  if (!_isTimeToNotify(subscriber)) {
    logger.debug({
      message: 'Notification time outside of notification range',
      timezone: lodash.get(subscriber, 'timezone.tz', DEFAULT_TIMEZONE),
      notify_time: subscriber.notify_time
    })
    callback();
    return;
  }

  if (subscriber.search_term) {
    async.autoInject({
      searchResults: (cb) => {
        soupCalendarService.searchForSoupOnDay(db, subscriber.search_term, utils.dateForText('today'),
          (err, searchResults) => {
            if (err) cb(err);
            else if (searchResults.length > 0) cb(null, soups);
            else cb({ clean: true, error: new Error(`no soups for "${subscriber.search_term}" found today`)});
          });
      },
      message: (searchResults, cb) => {
        if (searchResults) {
          const message = _buildCustomText(subscriber.search_term, searchResults.soups);
          slack.messageUserAsBot(subscriber.slack_user_id, message, subscriber.slack_slash_token, (err, res) => {
            if (err) callback(err);
            else if (!res.ok) callback(res);
            else callback(null, res);
          });
        } else {
          cb(null, null);
        }
      }
    }, (err) => {
      if (err && err.clean) logger.debug('_processSubscriber', subscriber, err);
      else if (err) logger.error('_processSubscriber', subscriber, err);
      callback();
    });
  } else {
    slack.messageUserAsBot(subscriber.slack_user_id, soups.text, subscriber.slack_slash_token, (err, res) => {
      if (err || !res.ok) logger.error('_processSubscriber', subscriber, err, res);
      callback();
    });
  }
}

const processSubscribers = (db) => {
  return (callback) => {
    logger.info('Running processSubscribers:: ', moment().toDate());
    async.autoInject({
      soups: (cb) => {
        soupCalendarViewService.getSoupsForDay(db, utils.dateForText('today'), cb);
      },
      subscribers: (cb) => {
        integrationSubscriberViewService.getAll(db, true, cb);
      },
      process: (soups, subscribers, cb) => {
        if (!soups) {
          cb({ clean: true, message: 'no soups for today' });
          return;
        }
        async.each(subscribers, (subscriber, eachCb) => {
          module.exports.private.processSubscriber(db, subscriber, soups, eachCb);
        }, cb);
      }
    }, (err) => {
      if (err && err.clean) {
        logger.info('processSubscribers complete', err.message);
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
  processSubscribers: processSubscribers,
  private: {
    processSubscriber: _processSubscriber,
    buildCustomTest: _buildCustomText,
    isTimeToNotify: _isTimeToNotify
  }
};
