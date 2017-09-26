'use strict';

const moment = require('moment');
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

module.exports = {
  searchForSoup: searchForSoup
};
