'use strict';

const _ = require('lodash');
const async = require('async');
const moment = require('moment');

const logger = require('../helpers/logger');
const importHelper = require('../helpers/importer');
const slack = require('../helpers/slack');
const soupCalendarService = require('./soupCalendarService');
const integrationSubscriberViewService = require('./integrationSubscriberViewService');
const { SafeError } = require('../helpers/utils');


function processUrl(db, url, options, callback) {
  const callbackOnce = _.once(callback);
  if (options.webhookUrl) {
    // Callback now, continue processing
    callbackOnce(null, { text: 'Processing PDF' });
  }
  async.autoInject({
    pdfJson: cb => importHelper.loadAndConvertPdf(url, cb),
    calendarRows: (pdfJson, cb) => {
      const plainTextArr = importHelper.extractFromPdf(pdfJson);
      const rows = importHelper.aggregateRows(plainTextArr);
      soupCalendarService.massUpdate(db, rows, options.user, cb);
    }
  }, (err, results) => {
    const stats = _.get(results, 'calendarRows');
    const successMessage = stats ?
      `PDF Imported ${stats.rows} soups for ${stats.startDate} - ${stats.endDate}` :
      'PDF Imported';
    const message = err ? err.message : successMessage;

    if (stats) {
      module.exports.performDateValidation(db, [stats.startDate, stats.endDate]);
    }
    if (options.webhookUrl) {
      slack.messageResponseUrl(options.webhookUrl, message);
    } else {
      logger.analytics('Imported from url', url, results.calendarRows);
      callbackOnce(err, { text: message });
    }
  });
}

function _buildInvalidDatesMessage(invalidDates) {
  const message = '*Warning*: The following dates do not have 2 soup records:';
  return _.reduce(invalidDates, (str, { day, soup_count }) => {
    return str + `\n> ${moment(day).format('dddd, MMM D')} - ${soup_count}`;
  }, message);
}

/**
 * Validates that each day in the date range has 2 rows
 * @param db {object}           Database object
 * @param dateRange {text[]}    date range to validate. example: [startDate, endDate]
 * @param callback {function}   callback. invoked with nothing
 */
function performDateValidation(db, dateRange, callback = _.noop) {
  const [startDate, endDate] = dateRange;
  async.autoInject({
    invalidDates: (cb) => {
      soupCalendarService.validateSoupsForRange(db, startDate, endDate, (err, rows) => {
        if (err) cb(err);
        else if (_.isEmpty(rows)) cb(new SafeError(`No rows breaking validation for ${startDate} - ${endDate}`));
        else cb(err, rows);
      });
    },
    admins: (invalidDates, cb) => integrationSubscriberViewService.getAdmins(db, true, cb),
    sendMessages: (invalidDates, admins, cb) => {
      const message = _buildInvalidDatesMessage(invalidDates);
      logger.warn(message);
      async.each(admins, (admin, ecb) => {
        slack.messageUserAsBot(admin.slack_user_id, message, admin.slack_slash_token, (e, res) => {
          if (e) logger.error('Validation message error for admin', admin.id, e);
          else if (res) logger.debug('Validation message sent for admin', admin.id, res);
          ecb();
        });
      }, cb);
    }
  }, (err, { invalidDates, admins }) => {
    if (err && err.safe) {
      logger.debug(err);
    } else if (err) {
      logger.error(err);
    } else {
      logger.info(`${admins.length} admins notified of ${invalidDates.length} days without 2 soups`);
    }
    callback(err);
  });
}

module.exports = {
  processUrl: processUrl,
  performDateValidation: performDateValidation
};
