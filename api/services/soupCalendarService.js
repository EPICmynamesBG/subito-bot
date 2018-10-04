'use strict';

const async = require('async');
const moment = require('moment');
const logger = require('../helpers/logger');
const queryHelper = require('../helpers/queryHelper');

function _parseRow(row) {
  if (!row) {
    return row;
  }
  return {
    day: moment(row.day).format('YYYY-MM-DD'),
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
  const formattedDate = moment(day).format('YYYY/MM/DD');
  queryHelper.custom(db, queryStr, [`%${searchStr.trim()}%`, formattedDate, searchStr.trim()], (err, rows) => {
    callback(err, Array.isArray(rows) ? rows.map(_parseRow) : []);
  });
}

function massUpdate(db, soupDays, user, callback) {
  let updatedCount = 0;
  let updatedRange = { start: null, end: null };
  async.each(soupDays, (soupDay, eachCb) => {
    let day = moment(soupDay.date).format('YYYY/MM/DD');
    if (updatedRange.start === null ||
      moment(updatedRange.start) > moment(soupDay.date)) {
      updatedRange.start = moment(soupDay.date);
    }
    if (updatedRange.end === null ||
      moment(updatedRange.end) < moment(soupDay.date)) {
      updatedRange.end = moment(soupDay.date);
    }
    const insertArr = soupDay.soups.map((soup) => {
      return {
        day: day,
        soup: soup,
        created_by: user || null
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
      startDate: updatedRange.start.format('YYYY/MM/DD'),
      endDate: updatedRange.end.format('YYYY/MM/DD')
    });
  });
}

function validateSoupsForRange(db, startDate, endDate, callback) {
  const start = moment(startDate).format('YYYY/MM/DD');
  const end = moment(endDate).format('YYYY/MM/DD');
  const queryStr = `SELECT COUNT(id) AS soup_count, day FROM soup_calendar
    WHERE \`day\` >= DATE(?) AND \`day\` <= DATE(?)
    GROUP BY day
    HAVING soup_count != 2
    ORDER BY \`day\`;`;
  queryHelper.custom(db, queryStr, [start, end], (err, rows) => {
    callback(err, rows);
  });
}

module.exports = {
  searchForSoup: searchForSoup,
  searchForSoupOnDay: searchForSoupOnDay,
  massUpdate: massUpdate,
  validateSoupsForRange: validateSoupsForRange
};
