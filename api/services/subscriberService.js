'use strict';

const async = require('async');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');

function addSubscriber(db, user, callback) {
  async.waterfall([
    (cb) => {
      queryHelper.insert(db, 'subscribers', user, cb);
    },
    (inserted, cb) => {
      module.exports.getSubscriberById(db, inserted.insertId, cb)
    }
  ], callback);
}

function getSubscribers(db, callback) {
  queryHelper.select(db, 'subscribers', callback);
}

function getSubscriberById(db, id, callback) {
  queryHelper.selectOne(db, 'subscribers', { id: id }, callback);
}

function getSubscriberBySlackUserId(db, slackId, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_user_id: slackId }, callback);
}

function getSubscriberBySlackUsername(db, slackName, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_username: slackName }, callback);
}

function deleteSubscriberById(db, id, callback) {
  queryHelper.deleteOne(db, 'subscribers', { id: id }, callback);
}

function deleteSubscriberBySlackUserId(db, slackId, callback) {
  queryHelper.deleteOne(db, 'subscribers', { slack_user_id: slackId }, callback);
}

function deleteSubscriberBySlackUsername(db, slackName, callback) {
  queryHelper.deleteOne(db, 'subscribers', { slack_username: slackName }, callback);
}

module.exports = {
  addSubscriber: addSubscriber,
  getSubscribers: getSubscribers,
  getSubscriberById: getSubscriberById,
  getSubscriberBySlackUserId: getSubscriberBySlackUserId,
  getSubscriberBySlackUsername: getSubscriberBySlackUsername,
  deleteSubscriberById: deleteSubscriberById
};
