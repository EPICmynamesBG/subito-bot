'use strict';

const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const request = require('request');
const PDFParser = require('pdf2json');
const { HttpStatusError} = require('common-errors');

const logger = require('./logger');
const soupCalendarService = require('../services/soupCalendarService');

function loadAndConvertPdf(url, callback) {
  const pdfParser = new PDFParser();

  pdfParser.on("pdfParser_dataError", (err) => {
    logger.error('PDF Parse Error', err);
    callback(err);
    pdfParser.abort();
  });
  pdfParser.on("pdfParser_dataReady", pdfData => callback(null, pdfData));

  /* eslint-disable max-len */
  const reqStream = request.get({
    url: url,
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
    },
    followAllRedirects: true
  });
  /* eslint-enable max-len */
  reqStream.on('response', (res) => {
    if (res.statusCode !== 200) {
      logger.warn('loadAndConvertPdf failed with status code', res.statusCode, res.body);
      callback(new HttpStatusError(res.statusCode, `Failed to load ${url}`));
      reqStream.abort();
    }
  });
  reqStream.on('error', (err) => {
    logger.error(err);
    callback(err);
    reqStream.abort();
  });
  reqStream.pipe(pdfParser);
}

function extractFromPdf(pdfJson) {
  const textValues = _.chain(pdfJson)
    .get('formImage.Pages[0].Texts', [])
    .map(({ R }) =>
      R.map(({ T }) => T)
    )
    .flatten()
    .map(decodeURIComponent)
    .value();
  return textValues;
}

/**
 * @param   {String[]}  textArr
 * @returns {Object[]}
 * @sample [{ date: '3/12/2018', soups: ['Soup 1', 'Soup 2'] }]
 */
function aggregateRows(textArr) {
  // determine when to stop reading the calendar
  const endFlagText = 'Soup Calendar';

  // Determine if end of soup name. If last char is char, num, or ), end the current soup.
  const soupEndCheck = s => /[a-z]|\d|\)/i.test(_.last(s));

  const dateTest = s => /(\d{1,2}\/\d{1,2}\/\d{4})\s*/i.test(s) && moment(s, 'M/D/YYYY').isValid()

  // row template
  let builderObj = { soups: [], date: null };

  let soupStr = '';
  let startReading = false;
  let stopReading = false;
  const aggregates = [];
  textArr.forEach((sample) => {
    const isDate = dateTest(sample);
    if (isDate) {
      // At sight of first date, enable soup reading
      if (!startReading) startReading = true;
      else {
        builderObj.soups.push(_.clone(soupStr));
        soupStr = '';
        builderObj.soups = _.compact(builderObj.soups);
        aggregates.push(_.clone(builderObj));
        builderObj = { soups: [], date: null };
      }
      builderObj.date = sample.trim();
    } else if (!isDate && startReading) {
      if (sample.includes(endFlagText)) stopReading = true;

      if (!stopReading) {
        soupStr += sample;
        if (soupEndCheck(sample)) {
          builderObj.soups.push(_.clone(soupStr));
          soupStr = '';
        }
      }
    }
  });
  return aggregates;
}

function importPdf(db, url, callback) {
  async.autoInject({
    pdfJson: cb => loadAndConvertPdf(url, cb),
    calendarRows: (pdfJson, cb) => {
      const plainTextArr = extractFromPdf(pdfJson);
      const rows = aggregateRows(plainTextArr);
      soupCalendarService.massUpdate(db, rows, cb);
    }
  }, callback);
}

module.exports = {
  importPdf: importPdf
};
