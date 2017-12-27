'use strict';

const async = require('async');
const Slack = require('slack-node');
const lodash = require('lodash');
const moment = require('moment');
const logger = require('./logger');
const utils  = require('./utils');
const SLACK_CONSTS = require('../../config/constants').SLACK_CONSTS;

function messageUserAsBot(userId, message, botToken, callback) {
  const slackbot = new Slack(botToken);
  async.autoInject({
    im: (cb) => {
      slackbot.api('im.open', {
        user: userId,
        return_im: true
      }, cb);
    },
    message: (im, cb) => {
      if (!im.ok) {
        logger.warn('im.open error', im);
        cb(new Error('An unexpected error occurred'));
        return;
      }
      slackbot.api('chat.postMessage', {
        text: message,
        channel: im.channel.id
      }, cb);
    }
  }, (err, res) => {
    if (!lodash.get(res, 'message.ok', false)) {
      logger.warn('chat.postMessage error', res.message);
      callback(new Error('An unexpected error occurred'));
      return;
    }
    callback(err, res.message);
  });
}

function fetchUserInfo(userId, token, callback) {
  const slack = new Slack(token);
  slack.api('users.info', {
    user: userId
  }, (err, res) => {
    if (err) {
      logger.error(err);
      callback(new Error('An unexpected error occurred'));
      return;
    } else if (!res.ok) {
      logger.info(res);
      callback(new Error(res.error));
      return;
    }
    callback(null, res.user);
  });
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
    let value = givenParams.join(' ');
    if (typeof value === 'string' && value.length === 0) value = null;
    paramObj[supportedParams[0]] = value;
  } else {
    if (supportedParams.length !== givenParams.length) {
      logger.warn('Slack param mapping likely to fail. ', supportedParams, givenParams);
    }
    supportedParams.forEach((param, index) => {
      let value = givenParams[index];
      if (typeof value === 'string' && value.length === 0) value = null;
      paramObj[param] = value;
    });
  }
  return paramObj;
}

module.exports = {
  messageUserAsBot: messageUserAsBot,
  fetchUserInfo: fetchUserInfo,
  utils: {
    parseRequestCommand: parseRequestCommand
  }
};
