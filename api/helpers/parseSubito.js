'use strict';

const request = require('request');
const htmlParser = require('node-html-parser');
const fs = require('fs');
const async = require('async');
const lodash = require('lodash');

const subitoUrl = 'http://www.subitosoups.com';
const subitoSoupsUrl = subitoUrl.concat('/soup-calendar');

const savePath = 'pipe/soups.html';

function _fetchSoupPage(callback) {
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

function fetchCalendar(callback) {
  async.autoInject({
    fetchSoupPage: (cb) => {
      _fetchSoupPage((err, res) => {
        if (err) {
          cb(null, new Error('Unable to load Subito soup calendar'));
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
      cb(null, getCalendarElements(body));
    },
    filterPlucked: (pluckDates, cb) => {
      let flattened = lodash.flatMapDeep(pluckDates, (element) => {
        return element.childNodes;
      });

      flattened.forEach((element) => {
        if (element instanceof htmlParser.TextNode) {
          console.log(element);
        }
      });
      cb(null, flattened);
    }
  }, (err, res) => {
    callback(null, res.pluckDates);
  });
}

module.exports = {
  fetchCalendar: fetchCalendar
}
