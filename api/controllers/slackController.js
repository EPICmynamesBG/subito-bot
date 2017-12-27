'use strict';

const lodash = require('lodash');
const errors = require('common-errors');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const slackUtils = require('../helpers/slack').utils;
const { CMD_USAGE, SUPPORTED_COMMANDS } = require('../../config/constants').SLACK_CONSTS;

const oauthService = require('../services/oauthService');
const soupCalendarController = require('./soupCalendarController');
const subscriberController = require('./subscriberController');

function handleSlack(req, res) {
  const params = utils.camelCase(req.body);

  if (!oauthService.validateTeamToken(params.token)) {
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
  case 'feedback':
    utils.processResponse(null,
      { text: 'Submit feedback <https://github.com/EPICmynamesBG/subito-bot/issues|here>!' }, res);
    break;
  default: {
    logger.warn('Unsupported command', action.command);
    let message = "Whoops, I don't recognize that command. Try one of these instead!";
    SUPPORTED_COMMANDS.forEach((cmd) => message += `\n>${cmd} ${CMD_USAGE[cmd]}`);
    utils.processResponse(null, { text: message }, res);
  }
  }
}

function handleOAuth(req, res) {
  if (!lodash.has(req, 'query.code')) {
    utils.processResponse(new errors.HttpStatusError(400, 'Missing code'), null, res);
    return;
  }
  if (lodash.has(req, 'query.error')) {
    // TODO: Maybe this should disable an oauth_integration?
    logger.warn('OAuth error', req.query.error);
    utils.processResponse(new errors.HttpStatusError(400, req.query.error), null, res);
    return;
  }
  oauthService.processOAuth(req.db, req.query, (err, results) => {
    if (err) {
      utils.processResponse(err, null, res);
      return;
    }
    if (lodash.get(results, 'team.domain', null) !== null) {
      const domain = results.team.domain;
      res.redirect(`https://${domain}.slack.com`);
      return;
    }
    utils.processResponse(null, { text: 'Subito-Suboto registered!' }, res);
  });
}


module.exports = {
  handleSlack: handleSlack,
  handleOAuth: handleOAuth
};
