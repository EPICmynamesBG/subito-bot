'use strict';

const request = require('request');
const htmlParser = require('htmlparser');
const fs = require('fs');

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

function _parse(rawHtml, callback) {
  const handler = new htmlParser.DefaultHandler((err, dom) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, dom);
  });
  const parser = new htmlParser.Parser(handler);
  parser.parseComplete(rawHtml);
}

function fetchCalendar(callback) {
  _fetchSoupPage((err, res) => {
    fs.readFile(savePath, 'utf8', (err2, data) => {
        if (err2) {
          callback('Unable to load Subito soup calendar');
          return;
        } else if ((err || res.statusCode !== 200) && !err2) {
          console.warn('Using last loaded subito schedule');
        }
        _parse(data, (err3, parsedHtml) => {
          console.log(err3, parsedHtml);
        });
    });
  });
}

module.exports = {
  fetchCalendar: fetchCalendar
}
