'use strict';

const async = require('async');
const moment = require('moment');

const logger = require('../api/helpers/logger');
const slack = require('../api/helpers/slack');
const utils = require('../api/helpers/utils');
const soupCalendarViewService = require('../api/services/soupCalendarViewService');
const subscriberService = require('../api/services/subscriberService');
const teamIntegrationService = require('../api/services/teamIntegrationService');
const db = require('../config/db');

let soups;

const cleanExit = { clean: true };

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
    subscriberService.getSubscriberBySlackUsername(db, 'bgroff', cb);
  },
  (subscriber, cb) => {
    teamIntegrationService.getIntegrationById(db, subscriber.slack_team_id, true, (err, integration) => {
      if (err) {
        logger.error('Err getting integration for subscriber', subscriber, err, integration);
        cb();
        return;
      }
      slack.messageUser(subscriber.slack_username, soups.text, integration.slack_webhook_url, (err2, res) => {
        if (err || res.status === 'fail') logger.error(subscriber, integration, err2, res);
        cb();
      });
    });
  }
], (err) => {
  if (err && err.clean) {
    logger.info('processSubscriberTest complete: no soups for today:: ', moment().format());
  } else if (err) {
    logger.error(err); // should never occur
  } else {
    logger.info('processSubscriberTest complete:: ', moment().format());
  }
  process.exit(0);
});
