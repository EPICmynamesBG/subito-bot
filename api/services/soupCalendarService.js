'use strict';

const async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const logger = require('../helpers/logger');
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
    callback(err, rows.map(_parseViewRow));
  });
}

function getSoupsForDay(db, day, callback) {
  queryHelper.selectOne(db, 'soup_calendar_view', { day: moment(day).format('YYYY/MM/DD') },
    (err, row) => {
      callback(err, _parseViewRow(row));
    });
}

function massUpdate(db, soupDays, callback) {
  const deleteQry = 'DELETE FROM soup_calendar WHERE day = ?';
  const insertQry = 'INSERT INTO soup_calendar (day, soup) VALUES (?, ?), (?, ?)';
  let updatedCount = 0;
  let updatedRange = { start: null, end: null };
  async.each(soupDays, (soupDay, eachCb) => {
    let day = moment(soupDay.date).format('YYYY/MM/DD');
    if (updatedRange.start === null || moment(updatedRange.start) > moment(soupDay.date)) {
      updatedRange.start = moment(soupDay.date);
    }
    if (updatedRange.end === null || moment(updatedRange.end) < moment(soupDay.date)) {
      updatedRange.end = moment(soupDay.date);
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
  }, (err, res) => {
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


module.exports = {
  getAllSoups: getAllSoups,
  getSoupsForDay: getSoupsForDay,
  massUpdate: massUpdate
}
