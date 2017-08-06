'use strict';

const Slack = require('slack-node')();
const config = require('../config/config');

Slack.setWebhook(config.SLACK_WEBHOOK_URL);

const WEBHOOK_OPTS = {
  username: config.SLACK_WEBHOOK_USERNAME || "Subito-Suboto",
  icon_emoji: config.SLACK_WEBHOOK_ICON || ":stew:"
};

function messageChannel(channel, message, callback) {
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '#'.concat(channel),
    message: message
  });
  Slack.webhook(hookSend, callback);
}

function messageUser(user, message, callback) {
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '@'.concat(channel),
    message: message
  });
  Slack.webhook(hookSend, callback);
}

module.exports = {
  
};
