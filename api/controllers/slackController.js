'use strict';

const lodash = require('lodash');
const errors = require('common-errors');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const slackUtils = require('../helpers/slack').utils;
const SUPPORTED_COMMANDS = require('../../config/constants').SLACK_CONSTS.SUPPORTED_COMMANDS;
const CMD_USAGE = require('../../config/constants').SLACK_CONSTS.CMD_USAGE;

const authService = require('../services/authService');
const soupCalendarController = require('./soupCalendarController');
const subscriberController = require('./subscriberController');

function handleSlack(req, res) {
  const params = utils.camelCase(req.body);
  authService.validateTeamToken(req.db, params.teamId, params.token, (valid) => {
    if (!valid) {
      logger.warn('Bad auth', params);
      utils.processResponse(new errors.HttpStatusError(403, 'Invalid Slack token'), null, res);
      return;
    }

    const action = slackUtils.parseRequestCommand(params);
    lodash.set(req, 'fromSlack', true);
    switch (action.command) {
    case 'subscribe':
      lodash.set(req, 'body.slackUserId', action.params.user.id);
      lodash.set(req, 'body.slackUsername', action.params.user.username);
      lodash.set(req, 'body.slackTeamId', action.params.user.teamId);
      lodash.set(req, 'body.searchTerm', action.params.search);
      subscriberController.subscribe(req, res);
      break;
    case 'unsubscribe':
      lodash.set(req, 'body.slackUserId', action.params.user.id);
      lodash.set(req, 'body.slackUsername', action.params.user.username);
      lodash.set(req, 'body.slackTeamId', action.params.user.teamId);
      subscriberController.unsubscribe(req, res);
      break;
    case 'search':
      lodash.set(req, 'swagger.params.search.value', action.params.search);
      soupCalendarController.search(req, res);
      break;
    case 'day':
      lodash.set(req, 'swagger.params.day.value', action.params.day);
      soupCalendarController.getSoupsForDay(req, res);
      break;
    default: {
      logger.warn('Unsupported command', action.command);
      let message = "Whoops, I don't recognize that command. Try one of these instead!";
      SUPPORTED_COMMANDS.forEach((cmd) => message += `\n>${cmd} ${CMD_USAGE[cmd]}`);
      utils.processResponse(null, { text: message }, res);
    }
    }
  });
}


module.exports = {
  handleSlack: handleSlack
};
