'use strict';

const request = require('request');
const htmlParser = require('node-html-parser');
const fs = require('fs');
const async = require('async');
const lodash = require('lodash');
const moment = require('moment');
const utils = require('./utils');
const logger = require('./logger');
const slack = require('./slack');

const subitoUrl = 'http://www.subitosoups.com';
const subitoSoupsUrl = subitoUrl.concat('/soup-calendar');

const savePath = 'pipe/soups.html';

function fetchSoupPage(callback) {
  const stream = fs.createWriteStream(savePath);
  let res;
  stream.on('finish', () => {
    callback(null, res);
  });
  request.get(subitoSoupsUrl)
    .on('error', callback)
    .on('response', (response) => {
      res = response;
    })
    .pipe(stream);
}

function recursivelySearchForElement(searchElement, htmlObj) {
  if (htmlObj.tagName === searchElement) {
    return htmlObj;
  } else {
    if (htmlObj.childNodes) {
      let found;
      htmlObj.childNodes.forEach((element) => {
        if (!found) {
          found = recursivelySearchForElement(searchElement, element);
        }
      });
      return found;
    } else {
      return false;
    }
  }
}

function _getElementsWithClasses(classList, htmlObj) {
  let returnVals = [];
  htmlObj.childNodes.forEach((element) => {
    if (lodash.isEqual(classList, element.classNames) && element.tagName === 'div') {
      returnVals.push(element);
    }
    if (element.childNodes) {
      returnVals.push(_getElementsWithClasses(classList, element));
    }
  });
  return lodash.flattenDeep(returnVals);
}

function getCalendarElements(htmlBody) {
  const classes = "element-children-container";
  return _getElementsWithClasses(classes.split(' '), htmlBody, 3);
}

function _filterDatesToPairs(dates) {
  let flattened = lodash.flatMapDeep(dates, (element) => {
    return element.childNodes;
  });

  let filtered = [];
  flattened.forEach((element) => {
    if (!element.childNodes) {
      return;
    }
    element.childNodes.forEach((element1) => {
      if (element1 instanceof htmlParser.TextNode &&
        element1.rawText.trim().length !== 0) {
        filtered.push(element1);
      }
    });
  });

  let pairs = [];
  let tempPairing = [];
  for (let i = 0; i < filtered.length; i++) {
    tempPairing.push(filtered[i]);
    if (i % 2 === 1) {
      pairs.push(tempPairing);
      tempPairing = [];
    }
  }
  return pairs;
}

function _soupStrToArray(rawStr) {
  let soupStr = utils.trimChar(rawStr[1].rawText, '\\n');
  let soupsArr = soupStr.split('\n\n');
  if (soupsArr.length !== 2) {
    logger.warn('parseSubito:: Attempting to recover from bad split', JSON.stringify(soupStr));
    soupsArr = soupStr.split('\n');
  }
  if (soupsArr.length !== 2) {
    slack.utils.sendError(`parseSubito:: Split failed. Potentially incorrect parsing - ${JSON.stringify(soupStr)}`);
  }
  return soupsArr;
}

function fetchCalendar(callback) {
  async.autoInject({
    fetchSoupPage: (cb) => {
      module.exports.private.fetchSoupPage((err, res) => {
        if (err) {
          logger.error('Unable to load Subito soup calendar', err);
          cb(null, null);
          return;
        }
        cb(null, res);
      });
    },
    savedHtml: (fetchSoupPage, cb) => {
      fs.readFile(savePath, 'utf8', cb);
    },
    pluckDates: (savedHtml, cb) => {
      const parsedHtml = htmlParser.parse(savedHtml);
      const body = recursivelySearchForElement('body', parsedHtml);
      process.nextTick(cb, null, getCalendarElements(body));
    },
    filterPlucked: (pluckDates, cb) => {
      const pairs = _filterDatesToPairs(pluckDates);
      const mapped = pairs.map((pair) => {
        const soupsArr = _soupStrToArray(pair);
        let soups = soupsArr.map(utils.textCleaner);
        return {
          date: moment(pair[0].rawText, 'dddd, M/D').toDate(),
          soups: soups
        };
      });
      process.nextTick(cb, null, mapped);
    }
  }, (err, res) => {
    if (err) {
      slack.utils.sendError(JSON.stringify(err));
    }
    callback(err, res.filterPlucked);
  });
}

module.exports = {
  private: {
    fetchSoupPage: fetchSoupPage
  },
  fetchCalendar: fetchCalendar
}
