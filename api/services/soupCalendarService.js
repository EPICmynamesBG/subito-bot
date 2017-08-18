'use strict';

const async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');

function _textForSlack(row) {
  let soups = row.soups.split(';');
  return `Here are the soups for _${utils.textForDate(row.day)}_: \n>${soups[0]}\n>${soups[1]}`;
}

function _parseViewRow(row) {
  return {
    text: _textForSlack(row),
    day: moment(row.day).format('YYYY-MM-DD'),
    soups: row.soups.split(';'),
    soupsStr: row.soups.replace(';', ' and ')
  };
}

function getAllSoups(db, callback) {
  const qry = 'SELECT * FROM soup_calendar_view';
  db.query(qry, (err, rows) => {
    callback(err, rows.map(_parseViewRow));
  });
}

function getSoupsForDay(db, day, callback) {
  const qry = 'SELECT * FROM soup_calendar_view WHERE day = ?';
  const date = moment(day).format('YYYY/MM/DD');
  db.query(qry, [date], (err, rows) => {
    callback(err, rows.map(_parseViewRow)[0]);
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
    async.autoInject({
      deleteAction: (cb) => {
        db.query(deleteQry, [day], cb);
      },
      insert: (deleteAction, cb) => {
        db.query(insertQry, [day, soupDay.soups[0], day, soupDay.soups[1]], cb);
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
