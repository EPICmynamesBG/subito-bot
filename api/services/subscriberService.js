'use strict';

const async = require('async');
const lodash = require('lodash');
const logger = require('../helpers/logger');
const queryHelper = require('../helpers/queryHelper');
const slack = require('../helpers/slack');
const oauthService = require('./oauthService');
const utils = require('../helpers/utils');

function _addUser(db, userObj, callback) {
  async.autoInject({
    team: (cb) => {
      oauthService.getOauthIntegrationById(db, userObj.slack_team_id, cb);
    },
    extendedInfo: (team, cb) => {
      slack.fetchUserInfo(userObj.slack_user_id, team.bot_token, (err, res) => {
        if (err) {
          logger.debug(err);
          cb(null, null);
        } else {
          cb(null, res);
        }
      });
    },
    insert: (extendedInfo, cb) => {
      const insertObj = lodash.clone(userObj);
      insertObj.timezone = JSON.stringify({
        name: lodash.get(extendedInfo, 'tz', null),
        label: lodash.get(extendedInfo, 'tz_label', null),
        offset: lodash.get(extendedInfo, 'tz_offset', null)
      });
      queryHelper.insert(db, 'subscribers', insertObj, cb);
    }
  }, (err, res) => {
    callback(err, res.insert);
  });
}

function addSubscriber(db, user, callback) {
  const mappedUser = {
    slack_user_id: lodash.get(user, 'slackUserId', null),
    slack_username: lodash.get(user, 'slackUsername', null),
    slack_team_id: lodash.get(user, 'slackTeamId', null) // TODO: add notify_time ?
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
      _addUser(db, mappedUser, cb);
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

function _mapSubscriber(callback) {
  return (err, res) => {
    if (err) callback(err);
    else if (Array.isArray(res)) {
      const mapped = lodash.map(res, (obj) => {
        const clone = lodash.clone(obj);
        if (!lodash.isPlainObject(clone.timezone)) {
          lodash.set(clone, 'timezone', JSON.parse(clone.timezone));
        }
        return clone;
      });
      callback(null, mapped);
    } else {
      const clone = lodash.clone(res);
      if (!lodash.isPlainObject(clone.timezone)) {
        lodash.set(clone, 'timezone', JSON.parse(clone.timezone));
      }
      callback(null, clone);
    }
  };
}

function getSubscribers(db, callback) {
  queryHelper.select(db, 'subscribers', _mapSubscriber(callback));
}

function getSubscribersForTeam(db, teamId, callback) {
  queryHelper.select(db, 'subscribers', { slack_team_id: teamId }, _mapSubscriber(callback));
}

function getSubscriberById(db, id, callback) {
  queryHelper.selectOne(db, 'subscribers', { id: id }, _mapSubscriber(callback));
}

function getSubscriberBySlackUserId(db, slackId, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_user_id: slackId }, _mapSubscriber(callback));
}

function getSubscriberBySlackUsername(db, slackName, slackTeamId, callback) {
  queryHelper.selectOne(db, 'subscribers', { slack_username: slackName, slack_team_id: slackTeamId },
    _mapSubscriber(callback));
}

function updateSubscriberBySlackUserId(db, slackId, updateObj, callback) {
  const clone = lodash.clone(updateObj);
  if (clone.timezone) {
    if (!lodash.isPlainObject(clone.timezone)) {
      clone.timezone = JSON.stringify(clone.timezone);
    }
  }
  if (clone.notify_time) {
    clone.notify_time = utils.parseTime(clone.notify_time);
  }
  queryHelper.update(db, 'subscribers', { slack_user_id: slackId }, clone, callback);
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
  getSubscriberById: getSubscriberById,
  getSubscriberBySlackUserId: getSubscriberBySlackUserId,
  getSubscriberBySlackUsername: getSubscriberBySlackUsername,
  updateSubscriberBySlackUserId: updateSubscriberBySlackUserId,
  deleteSubscriberById: deleteSubscriberById,
  deleteSubscriberBySlackUserId: deleteSubscriberBySlackUserId,
  deleteSubscriberBySlackUsername: deleteSubscriberBySlackUsername
};
