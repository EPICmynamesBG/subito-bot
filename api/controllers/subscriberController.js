'use strict';

const errors = require('common-errors');
const utils = require('../helpers/utils');
const subscriberService = require('../services/subscriberService');

function subscribe(req, res) {
  const params = req.body;
  subscriberService.addSubscriber(req.db, params, (err, results) => {
    utils.processResponse(err, results, res);
  });
}

function unsubscribe(req, res) {
  const params = req.body;
  const handleResponse = function(err, results) {
    if (!err && req.fromSlack) {
      if (results.affectedRows === 0) {
        utils.processResponse(err, { text: "Please subscribe to unsubscribe :thinking_face:" }, res);
        return;
      }
      utils.processResponse(err, { text: "You've been unsubscribed :disappointed:" }, res);
      return;
    }
    utils.processResponse(err, { text: results.text }, res);
  };

  if (params.id) {
    subscriberService.deleteSubscriberById(req.db, params.id, handleResponse);
  } else if (params.slackUserId) {
    subscriberService.deleteSubscriberBySlackUserId(req.db, params.slackUserId, handleResponse);
  } else if (params.slackUsername) {
    subscriberService.deleteSubscriberBySlackUsername(req.db, params.slackUsername, params.slackTeamId, handleResponse);
  } else {
    const msg = 'Missing one of required: id, slackUserId, slackUsername';
    utils.processResponse(new errors.HttpStatusError(400, msg), null, res);
  }
}

function updateSettings(req, res) {
  const notificationTime = req.swagger.params.body.value.notificationTime;
  const slackUserId = req.swagger.params.body.value.slackUserId;

  subscriberService.updateSubscriberBySlackUserId(req.db, slackUserId, { notify_time: notificationTime },
    (err, results) => {
      if (req.fromSlack) {
        if (results.affectedRows === 0) {
          utils.processResponse(err, { text: "Something unexpected occurred :fearful:" }, res);
          return;
        }
        utils.processResponse(err, {
          text: `Your subscription notification time has been updated to ${notificationTime}`
        }, res);
        return;
      }
      utils.processResponse(err, { text: results.text }, res);
    });
}

module.exports = {
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  unsubscribe2: unsubscribe,
  updateSettings: updateSettings
};
