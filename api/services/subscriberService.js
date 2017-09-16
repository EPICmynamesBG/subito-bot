'use strict';

const async = require('async');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');

function addSubscriber(db, user, callback) {
  const mappedUser = {
    slack_user_id: lodash.get(user, 'slackUserId', null),
    slack_username: lodash.get(user, 'slackUsername', null),
    slack_team_id: lodash.get(user, 'slackTeamId', null),
    slack_team_domain: lodash.get(user, 'slackTeamDomain', null)
  };
  async.waterfall([
    (cb) => {
      queryHelper.insert(db, 'subscribers', mappedUser, cb);
    },
    (inserted, cb) => {
      module.exports.getSubscriberById(db, inserted.insertId, cb)
    }
  ], (err, subscriber) => {
    if (err && err.code === 'ER_DUP_ENTRY') {
      const msg = { text: "You're already subscribed :+1:" };
      return callback(null, Object.assign({}, subscriber, msg));
    } else if (err) {
      return callback(err);
    }
    const success = { text: "You're subscribed! :tada:" };
    callback(err, Object.assign({}, subscriber, success));
  });
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
  deleteSubscriberById: deleteSubscriberById,
  deleteSubscriberBySlackUserId: deleteSubscriberBySlackUserId,
  deleteSubscriberBySlackUsername: deleteSubscriberBySlackUsername
};
