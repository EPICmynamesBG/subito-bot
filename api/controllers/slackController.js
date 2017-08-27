'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const slackUtils = require('../helpers/slack').utils;
const config = require('../../config/config');
const SUPPORTED_COMMANDS = require('../../config/constants').SLACK_CONSTS.SUPPORTED_COMMANDS;
const CMD_USAGE = require('../../config/constants').SLACK_CONSTS.CMD_USAGE;

const soupCalendarController = require('./soupCalendarController');

function _slackValidation(params) {
  return params.body.token === config.SLACK_SLASH_TOKEN;
}

function handleSlack(req, res) {
  const params = utils.getSwaggerParams(req);
  logger.debug(req.url, params);

  if (!_slackValidation(params)) {
    logger.info('403: Invalid Slack token', params.token);
    res.status(403).json({
      text: 'Invalid Slack token'
    });
    return;
  }

  const action = slackUtils.parseRequestCommand(params);
  switch (action.command) {
    case 'subscribe':
      logger.info('Subscribe requested', action.params);
      res.json({ text: 'Whoa there eager beaver, this function is still in development!' });
      break;
    case 'search':
      logger.info('Search requested', action.params);
      res.json({ text: 'Whoa there eager beaver, this function is still in development!' });
      break;
    case 'day':
      logger.debug('slackHelper -> getSoupsForDay');
      lodash.set(req, 'swagger.params.day.value', action.params.day);
      soupCalendarController.getSoupsForDay(req, res);
      break;
    default:
      logger.warn('Unsupported command', action.command);
      let message = "Whoops, I don't recognize that command. Try one of these instead!";
      SUPPORTED_COMMANDS.forEach((cmd) => message += `\n>${cmd} ${CMD_USAGE[cmd]}`);
      res.json({
        text: message
      });
  }
}


module.exports = {
  handleSlack: handleSlack
};
