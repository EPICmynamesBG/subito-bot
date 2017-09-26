'use strict';

const Slack = require('slack-node');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('./logger');
const utils  = require('./utils');
const config = require('../../config/config');
const SLACK_CONSTS = require('../../config/constants').SLACK_CONSTS;

const slack = new Slack();

//slack.setWebhook(config.SLACK_WEBHOOK_URL);

const WEBHOOK_OPTS = {
  username: config.SLACK_WEBHOOK_USERNAME || "Subito-Suboto",
  icon_emoji: config.SLACK_WEBHOOK_ICON || ":stew:"
};

function messageChannel(channel, message, webhookUrl, callback) {
  slack.setWebhook(webhookUrl);
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '#'.concat(channel),
    text: message
  });
  slack.webhook(hookSend, callback);
}

function messageUser(user, message, webhookUrl, callback) {
  slack.setWebhook(webhookUrl);
  const hookSend = Object.assign({}, WEBHOOK_OPTS, {
    channel: '@'.concat(user),
    text: message
  });
  slack.webhook(hookSend, callback);
}

function sendError(message, callback) {
  if (typeof callback !== 'function') {
    // eslint-disable-next-line no-param-reassign
    callback = (err) => {
      if (err) logger.error(err);
    };
  }
  logger.error(message);
  if (process.env.NODE_ENV === 'test') return;
  if (config.SLACK_NOTIFY_ERROR_USER) {
    module.exports.messageUser(config.SLACK_NOTIFY_ERROR_USER, message, callback)
  } else {
    process.nextTick(callback, new Error('SLACK_NOTIFY_ERROR_USER not set'));
  }
}

function parseRequestCommand(params) {
  const snakeParams = utils.snakeCase(params);
  let template = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
  let text = params;
  if (typeof params === 'object') {
    text = lodash.get(params, 'text', null);
  }

  if (!text || text.trim().length === 0) {
    template.command = 'day';
    template.params.day = null;
    template.params.user = {
      id: lodash.get(snakeParams, 'user_id', null),
      username: lodash.get(snakeParams, 'user_name', null),
      teamId: lodash.get(snakeParams, 'team_id', null),
      teamDomain: lodash.get(snakeParams, 'team_domain', null)
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
    id: lodash.get(snakeParams, 'user_id', null),
    username: lodash.get(snakeParams, 'user_name', null),
    teamId: lodash.get(snakeParams, 'team_id', null),
    teamDomain: lodash.get(snakeParams, 'team_domain', null)
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
    parseRequestCommand: parseRequestCommand,
    sendError: sendError
  }
};
