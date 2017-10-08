'use strict';

const async = require('async');
const moment = require('moment');
const integrationSubscriberViewService = require('../api/services/integrationSubscriberViewService');
const soupCalendarViewService = require('../api/services/soupCalendarViewService');
const cronHelper = require('../api/helpers/cronHelper');
const logger = require('../api/helpers/logger');

const db = require('../config/db');

const day = 'October 9, 2017';
const subUsername = 'mynamesbg';

async.autoInject({
  soup: (cb) => {
    soupCalendarViewService.getSoupsForDay(db, moment(day).toDate(), cb);
  },
  subscriber: (cb) => {
    integrationSubscriberViewService.getAll(db, true, (err, subs) => {
      if (err) {
        cb(err);
        return;
      }
      const subscriber = subs.find(sub => sub.slack_username === subUsername);
      cb(null, subscriber);
    });
  },
  run: (soup, subscriber, cb) => {
    cronHelper.private.processSubscriber(db, subscriber, soup, cb);
  }
}, (err) => {
  if (err) logger.error(err);
  else logger.info('Test Complete');
});
