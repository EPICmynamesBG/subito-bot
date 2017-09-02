'use strict';

const lodash = require('lodash');
const errors = require('common-errors');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const slackUtils = require('../helpers/slack').utils;
const config = require('../../config/config');
const SUPPORTED_COMMANDS = require('../../config/constants').SLACK_CONSTS.SUPPORTED_COMMANDS;
const CMD_USAGE = require('../../config/constants').SLACK_CONSTS.CMD_USAGE;

const soupCalendarController = require('./soupCalendarController');
const subscriberController = require('./subscriberController');

function _slackValidation(params) {
  return params.token === config.SLACK_SLASH_TOKEN;
}

function handleSlack(req, res) {
  const params = req.body;
  if (!_slackValidation(params)) {
    utils.processResponse(new errors.HttpStatusError(403, 'Invalid Slack token'), null, res);
    return;
  }

  const action = slackUtils.parseRequestCommand(params);
  switch (action.command) {
    case 'subscribe':
      logger.debug('slackHelper -> subscribe');
      lodash.set(req, 'fromSlack', true);
      lodash.set(req, 'body.slackUserId', action.params.user.id);
      lodash.set(req, 'body.slackUsername', action.params.user.username);
      subscriberController.subscribe(req, res);
      break;
    case 'unsubscribe':
      logger.debug('slackHelper -> subscribe');
      lodash.set(req, 'fromSlack', true);
      lodash.set(req, 'body.slackUserId', action.params.user.id);
      lodash.set(req, 'body.slackUsername', action.params.user.username);
      subscriberController.unsubscribe(req, res);
      break;
    case 'search':
      logger.info('Search requested', action.params);
      lodash.set(req, 'fromSlack', true);
      utils.processResponse(null, { text: 'Whoa there eager beaver, this function is still in development!' }, res);
      break;
    case 'day':
      logger.debug('slackHelper -> getSoupsForDay');
      lodash.set(req, 'swagger.params.day.value', action.params.day);
      lodash.set(req, 'fromSlack', true);
      soupCalendarController.getSoupsForDay(req, res);
      break;
    default:
      logger.warn('Unsupported command', action.command);
      let message = "Whoops, I don't recognize that command. Try one of these instead!";
      SUPPORTED_COMMANDS.forEach((cmd) => message += `\n>${cmd} ${CMD_USAGE[cmd]}`);
      utils.processResponse(null, { text: message }, res);
  }
}


module.exports = {
  handleSlack: handleSlack
};
