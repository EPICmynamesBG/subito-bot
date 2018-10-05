'use strict';

const async = require('async');
const lodash = require('lodash');
const queryHelper = require('../helpers/queryHelper');
const utils = require('../helpers/utils');


function addSubscriber(db, user, callback) {
  const mappedUser = {
    slack_user_id: lodash.get(user, 'slackUserId', null),
    slack_username: lodash.get(user, 'slackUsername', null),
    slack_team_id: lodash.get(user, 'slackTeamId', null)
  };
  const searchTerm = lodash.get(user, 'searchTerm', null);
  if (searchTerm) {
    mappedUser.search_term = searchTerm;
  }
  async.waterfall([
    (cb) => {
      module.exports.getSubscriberBySlackUserId(db, mappedUser.slack_user_id, (err, sub) => {
        if (err) {
          cb(err);
          return;
        } else if (sub) {
          cb({ code: 'ER_DUP_ENTRY' }, sub);
          return;
        }
        cb();
      });
    },
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
    let success = { text: "You're subscribed! :tada:" };
    if (searchTerm) {
      success = { text: `You're subscribed to _${searchTerm}_! :tada:` };
    }
    callback(err, Object.assign({}, subscriber, success));
  });
}

function getSubscribers(db, callback) {
  queryHelper.select(db, 'subscribers', callback);
}

function getSubscribersForTeam(db, teamId, callback) {
  queryHelper.select(db, 'subscribers', { slack_team_id: teamId }, callback);
}

function getAdmins(db, callback) {
  queryHelper.select(db, 'subscribers', { is_admin: true }, callback);
}

function getSubscriberById(db, id, callback) {
  queryHelper.selectOne(db, 'subscribers', { id: id }, callback);
}

function getSubscriberBySlackUserId(db, slackId, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_user_id: slackId }, callback);
}

function getSubscriberBySlackUsername(db, slackName, slackTeamId, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_username: slackName, slack_team_id: slackTeamId },
    callback);
}

function updateSubscriberBySlackUserId(db, slackId, updateObj, callback) {
  const clone = lodash.clone(updateObj);
  if (clone.notify_time) {
    clone.notify_time = utils.parseTime(clone.notify_time);
  }
  lodash.unset(updateObj, 'is_admin');
  queryHelper.update(db, 'subscribers', clone, { slack_user_id: slackId }, callback);
}

function deleteSubscriberById(db, id, callback) {
  queryHelper.deleteOne(db, 'subscribers', { id: id }, callback);
}

function deleteSubscriberBySlackUserId(db, slackId, callback) {
  queryHelper.deleteOne(db, 'subscribers', { slack_user_id: slackId }, callback);
}

function deleteSubscriberBySlackUsername(db, slackName, slackTeamId, callback) {
  queryHelper.deleteOne(db, 'subscribers', { slack_username: slackName, slack_team_id: slackTeamId }, callback);
}


module.exports = {
  addSubscriber: addSubscriber,
  getSubscribers: getSubscribers,
  getSubscribersForTeam: getSubscribersForTeam,
  getAdmins: getAdmins,
  getSubscriberById: getSubscriberById,
  getSubscriberBySlackUserId: getSubscriberBySlackUserId,
  getSubscriberBySlackUsername: getSubscriberBySlackUsername,
  updateSubscriberBySlackUserId: updateSubscriberBySlackUserId,
  deleteSubscriberById: deleteSubscriberById,
  deleteSubscriberBySlackUserId: deleteSubscriberBySlackUserId,
  deleteSubscriberBySlackUsername: deleteSubscriberBySlackUsername
};
