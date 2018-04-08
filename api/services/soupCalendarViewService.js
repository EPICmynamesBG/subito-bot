'use strict';

const lodash = require('lodash');
const moment = require('moment');
const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');

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
    day: moment(row.day).format('YYYY-MM-DD'),
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
  queryHelper.selectOne(db, 'soup_calendar_view', { day: moment(day).format('YYYY/MM/DD') },
    (err, row) => {
      callback(err, _parseViewRow(row));
    });
}

function getSoupsForWeek(db, dayInWeek, callback) {
  const day = moment(dayInWeek);
  const startOfWeek = day.startOf('week').format('YYYY/MM/DD');
  const endOfWeek = day.endOf('week').format('YYYY/MM/DD');
  const queryStr = `SELECT * FROM soup_calendar_view
    WHERE \`day\` > DATE(?) AND \`day\` < DATE(?)
    ORDER BY \`day\`;`;
  queryHelper.custom(db, queryStr, [startOfWeek, endOfWeek], (err, rows) => {
    if (err) callback (err, []);
    else if (!Array.isArray(rows)) callback(null, {
      text: `No soups for week of ${day}`,
      soups: [],
      start: startOfWeek,
      end: endOfWeek
    });
    else {
      const obj = rows.reduce((accumulatorObj, row) => {
        const soups = row.soups.split(';');
        accumulatorObj.text.push(`_${utils.textForDate(row.day)}_: ${row.soups.replace(';', ', ')}`);
        accumulatorObj.soups = accumulatorObj.soups.concat(soups);
        return accumulatorObj;
      }, {
        text: [],
        soups: [],
        start: startOfWeek,
        end: endOfWeek
      });
      obj.text = obj.text.join('\n');
      obj.soups = lodash.uniq(obj.soups);
      callback(null, obj);
    }
  });
}

module.exports = {
  getAllSoups: getAllSoups,
  getSoupsForDay: getSoupsForDay,
  getSoupsForWeek: getSoupsForWeek
}
