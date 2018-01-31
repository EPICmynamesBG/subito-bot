'use strict';

const async = require('async');
const moment = require('moment-timezone');
const logger = require('../helpers/logger');
const queryHelper = require('../helpers/queryHelper');
const { SUBITO_TIMEZONE, DEFAULT_TIMEZONE } = require('../../config/config');

moment.tz.setDefault(DEFAULT_TIMEZONE);

function _parseRow(row) {
  if (!row) {
    return row;
  }
  return {
    day: moment.tz(row.day, SUBITO_TIMEZONE).format('YYYY-MM-DD'),
    soup: row.soup
  };
}

function searchForSoup(db, searchStr, callback) {
  if (!searchStr || searchStr.trim() === '') {
    process.nextTick(callback, null, []);
    return;
  }
  const queryStr = `SELECT * FROM soup_calendar
    WHERE LOWER(\`soup\`) LIKE LOWER(?)
	   AND \`day\` >= DATE(now())
    ORDER BY \`day\`, LOCATE(LOWER(\`soup\`), LOWER(?));`;
  queryHelper.custom(db, queryStr, [`%${searchStr.trim()}%`, searchStr.trim()], (err, rows) => {
    callback(err, Array.isArray(rows) ? rows.map(_parseRow) : []);
  });
}

function searchForSoupOnDay(db, searchStr, day, callback) {
  if (!searchStr || searchStr.trim() === '') {
    process.nextTick(callback, null, []);
    return;
  }
  const queryStr = `SELECT * FROM soup_calendar
    WHERE LOWER(\`soup\`) LIKE LOWER(?)
	   AND \`day\` = DATE(?)
    ORDER BY \`day\`, LOCATE(LOWER(\`soup\`), LOWER(?));`;
  const formattedDate = moment(day).tz(SUBITO_TIMEZONE).format('YYYY/MM/DD');
  queryHelper.custom(db, queryStr, [`%${searchStr.trim()}%`, formattedDate, searchStr.trim()], (err, rows) => {
    callback(err, Array.isArray(rows) ? rows.map(_parseRow) : []);
  });
}

function massUpdate(db, soupDays, callback) {
  let updatedCount = 0;
  let updatedRange = { start: null, end: null };
  async.each(soupDays, (soupDay, eachCb) => {
    let day = moment.tz(soupDay.date, SUBITO_TIMEZONE).format('YYYY/MM/DD');
    if (updatedRange.start === null ||
      moment.tz(updatedRange.start, SUBITO_TIMEZONE) > moment.tz(soupDay.date, SUBITO_TIMEZONE)) {
      updatedRange.start = moment.tz(soupDay.date, SUBITO_TIMEZONE);
    }
    if (updatedRange.end === null ||
      moment.tz(updatedRange.end, SUBITO_TIMEZONE) < moment.tz(soupDay.date, SUBITO_TIMEZONE)) {
      updatedRange.end = moment.tz(soupDay.date, SUBITO_TIMEZONE);
    }
    const insertArr = soupDay.soups.map((soup) => {
      return {
        day: day,
        soup: soup
      };
    });
    async.autoInject({
      deleteAction: (cb) => {
        queryHelper.delete(db, 'soup_calendar', { day: day }, cb);
      },
      insert: (deleteAction, cb) => {
        queryHelper.insert(db, 'soup_calendar', insertArr, cb);
      }
    }, (autoErr, autoRes) => {
      if (autoErr) {
        eachCb(autoErr);
        return;
      }
      updatedCount += parseInt(autoRes.insert.affectedRows || 0);
      eachCb(autoErr, autoRes);
    });
  }, (err) => {
    if (err) {
      logger.error(err);
    }
    callback(err, {
      rows: updatedCount,
      startDate: updatedRange.start.format('YYYY/MM/DD Z'),
      endDate: updatedRange.end.format('YYYY/MM/DD Z')
    });
  });
}

module.exports = {
  searchForSoup: searchForSoup,
  searchForSoupOnDay: searchForSoupOnDay,
  massUpdate: massUpdate
};
