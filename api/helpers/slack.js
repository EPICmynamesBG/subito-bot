'use strict';

const Slack = require('slack-node');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('./logger');
const config = require('../../config/config');
const SLACK_CONSTS = require('../../config/constants').SLACK_CONSTS;

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
  let template = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
  let text = params;
  if (typeof params === 'object') {
    text = lodash.get(params, 'body.text', null);
  }

  if (!text || text.trim().length === 0) {
    template.command = 'day';
    template.params.day = null;
    template.params.user = {
      id: lodash.get(params, 'body.user_id', null),
      username: lodash.get(params, 'body.user_name', null)
    };
    return template;
  }

  text = text.trim();
  const cmdArr = text.split(" ");
  const possibleCommand = cmdArr[0].toLowerCase();
  cmdArr.splice(0, 1);
  if (SLACK_CONSTS.SUPPORTED_COMMANDS.includes(possibleCommand)) {
    template.command = possibleCommand;
    template.params = _parseRequestParams(template.command, cmdArr);
  } else if (moment(text).isValid() || text.toLowerCase() === 'tomorrow' ||
            text.toLowerCase() === 'today' || text.toLowerCase() === 'yesterday') {
    template.command = 'day';
    template.params.day = text;
  } else {
    logger.warn('Unsupported command.', possibleCommand, cmdArr);
    template.command = possibleCommand;
    template.params.unknown = cmdArr.join(' ');
  }
  template.params.user = {
    id: lodash.get(params, 'body.user_id', null),
    username: lodash.get(params, 'body.user_name', null)
  };
  return template;
}

function _parseRequestParams(command, givenParams) {
  const paramObj = {};
  const supportedParams = SLACK_CONSTS.CMD_PARAM_MAP[command];

  if (supportedParams.length === 1) {
    paramObj[supportedParams[0]] = givenParams.join(' ');
  } else {
    if (supportedParams.length !== givenParams.length) {
      logger.warn('Slack param mapping likely to fail. ', supportedParams, givenParams);
    }
    supportedParams.forEach((param, index) => {
      paramObj[param] = givenParams[index];
    });
  }

  return paramObj;
}

module.exports = {
  messageUser: messageUser,
  messageChannel: messageChannel,
  utils: {
    parseRequestCommand: parseRequestCommand
  }
};
