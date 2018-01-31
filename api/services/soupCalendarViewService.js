'use strict';

const moment = require('moment');
const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');
const { SUBITO_TIMEZONE } = require('../../config/config');

function _textForSlack(row) {
  let soups = row.soups.split(';');
  return `Here are the soups for _${utils.textForDate(row.day)}_: \n>${soups[0]}\n>${soups[1]}`;
}

function _parseViewRow(row) {
  if (!row) {
    return row;
  }
  return {
    text: _textForSlack(row),
    day: moment.tz(row.day, SUBITO_TIMEZONE).format('YYYY-MM-DD'),
    soups: row.soups.split(';'),
    soupsStr: row.soups.replace(';', ' and ')
  };
}

function getAllSoups(db, callback) {
  queryHelper.select(db, 'soup_calendar_view', null, (err, rows) => {
    callback(err, Array.isArray(rows) ? rows.map(_parseViewRow) : []);
  });
}

function getSoupsForDay(db, day, callback) {
  queryHelper.selectOne(db, 'soup_calendar_view', { day: moment.tz(day, SUBITO_TIMEZONE).format('YYYY/MM/DD') },
    (err, row) => {
      callback(err, _parseViewRow(row));
    });
}

module.exports = {
  getAllSoups: getAllSoups,
  getSoupsForDay: getSoupsForDay
}
