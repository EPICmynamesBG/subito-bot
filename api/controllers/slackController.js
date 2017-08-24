'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const slackUtils = require('../helpers/slack').utils;
const config = require('../../config/config');

const soupCalendarController = require('./soupCalendarController');

function _slackValidation(params) {
  if (params.body.token === config.SLACK_SLASH_TOKEN) {
    return true;
  }
  return false;
}

function handleSlack(req, res) {
  const params = utils.getSwaggerParams(req);
  logger.debug(req.url, params);

  if (!_slackValidation(params)) {
    logger.error('403: Invalid Slack token');
    res.status(403).json({
      text: 'Invalid Slack token'
    });
    return;
  }

  const action = slackUtils.parseRequestCommand(params);
  switch (action.command) {
    case 'test':
      // do stuff
      break;
    default:
      logger.debug('slackHelper -> getSoupsForDay');
      lodash.set(req, 'swagger.params.day.value', action.params.date);
      soupCalendarController.getSoupsForDay(req, res);
  }
}


module.exports = {
  handleSlack: handleSlack
};
