'use strict';

const _ = require('lodash');
const async = require('async');

const logger = require('../helpers/logger');
const importHelper = require('../helpers/importer');
const slack = require('../helpers/slack');
const soupCalendarService = require('./soupCalendarService');


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
    if (options.webhookUrl) {
      slack.messageResponseUrl(options.webhookUrl, message);
    } else {
      logger.analytics('Imported from url', url, results.calendarRows);
      callbackOnce(err, { text: message });
    }
  });
}

module.exports = {
  processUrl: processUrl
};
