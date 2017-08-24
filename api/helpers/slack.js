'use strict';

const Slack = require('slack-node');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('./logger');
const config = require('../../config/config');

const slack = new Slack();

slack.setWebhook(config.SLACK_WEBHOOK_URL);

const WEBHOOK_OPTS = {
  username: config.SLACK_WEBHOOK_USERNAME || "Subito-Suboto",
  icon_emoji: config.SLACK_WEBHOOK_ICON || ":stew:"
};

function messageChannel(channel, message, callback) {
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '#'.concat(channel),
    message: message
  });
  slack.webhook(hookSend, callback);
}

function messageUser(user, message, callback) {
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '@'.concat(channel),
    message: message
  });
  slack.webhook(hookSend, callback);
}

function parseRequestCommand(params) {
  const template = {
    command: null,
    params: {}
  };
  let text = lodash.get(params, 'body.text', null);
  if (!text || text.trim().length === 0) {
    return template;
  }
  text = text.trim();
  const cmdArr = text.split(" ");
  logger.warn('parseRequestCommand TODO');
  return template;
}

module.exports = {
  messageUser: messageUser,
  messageChannel: messageChannel,
  utils: {
    parseRequestCommand: parseRequestCommand
  }
};
