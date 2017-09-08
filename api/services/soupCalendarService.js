'use strict';

const async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
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
  const queryStr = `SELECT * FROM soup_calendar
    WHERE LOWER(\`soup\`) LIKE LOWER(?)
	AND \`day\` >= DATE(now())
    ORDER BY \`day\`, LOCATE(LOWER(\`soup\`), LOWER(?));`
  queryHelper.custom(db, queryStr, [`%${searchStr}%`, searchStr], (err, rows) => {
    callback(err, Array.isArray(rows) ? rows.map(_parseRow) : []);
  });
}

module.exports = {
  searchForSoup: searchForSoup
};
