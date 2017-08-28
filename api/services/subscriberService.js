'use strict';

const async = require('async');
const lodash = require('lodash');
//const mysql = require('mysql');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');

function addSubscriber(db, user, callback) {
  const insertQry = 'INSERT INTO subscribers (slack_user_id, slack_username) VALUES (?, ?)';
  db.query(insertQry, [user.id, user.username], (err, rows) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }
    const returnUser = {
      id: rows.insertId,
      slack_user_id: user.id,
      slack_username: user.username
    };
    callback(null, returnUser);
  });
}

function getSubscribers(db, callback) {
  const insertQry = 'SELECT * FROM subscribers;';
  db.query(insertQry, [], (err, rows) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }
    callback(null, rows);
  });
}

function getSubscriberById(db, id, callback) {
  const insertQry = 'SELECT * FROM subscribers WHERE id = ?';
  db.query(insertQry, [id], (err, rows) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }
    if (!rows || rows.length === 0) {
      return callback(null, null);
    }
    callback(null, rows[0]);
  });
}

function getSubscriberBySlackUserId(db, slackId, callback) {
  const insertQry = 'SELECT * FROM subscribers WHERE slack_user_id = ?';
  db.query(insertQry, [slackId], (err, rows) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }
    if (!rows || rows.length === 0) {
      return callback(null, null);
    }
    callback(null, rows[0]);
  });
}

function getSubscriberBySlackUsername(db, slackName, callback) {
  const insertQry = 'SELECT * FROM subscribers WHERE slack_username = ?';
  db.query(insertQry, [slackName], (err, rows) => {
    if (err) {
      logger.error(err);
      return callback(err);
    }
    if (!rows || rows.length === 0) {
      return callback(null, null);
    } else if (rows.length > 1) {
      logger.warn('Multiple subscribers with slackName found', slackName, rows);
    }
    callback(null, rows[0]);
  });
}

module.exports = {
  addSubscriber: addSubscriber,
  getSubscribers: getSubscribers,
  getSubscriberById: getSubscriberById,
  getSubscriberBySlackUserId: getSubscriberBySlackUserId,
  getSubscriberBySlackUsername: getSubscriberBySlackUsername
};
