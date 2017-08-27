'use strict';

const async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');

function addSubscriber(db, user, callback) {
  const insertQry = 'INSERT INTO subscribers (slack_user_id, slack_username) VALUES (?, ?)';
  db.query(insertQry, [user.id, user.username], (err, rows) => {
    console.log(rows);
    callback(err, rows);
  });
}
