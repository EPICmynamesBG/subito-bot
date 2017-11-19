'use strict';

const async = require('async');
const errors = require('common-errors');
const lodash = require('lodash');
const request = require('request');
const Slack = require('slack-node');
const queryHelper = require('../helpers/queryHelper');
const utils = require('../helpers/utils');
const logger = require('../helpers/logger');
const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = require('../../config/config');

/**
 * Validates a Slack request to a registered Team
 * @author Brandon Groff <mynamesbg@gmail.com>
 * @param {object} db
 * @param {string} teamId   Slack team id
 * @param {string} token    the Slack slash command token
 * @param {function} callback callback function with 1 param: true/false
 */
function validateTeamToken(db, teamId, token, callback) {
  queryHelper.selectOne(db, 'team_integrations',
    { team_id: teamId },
    (err, res) => {
      if (err) {
        logger.warn('Validation error', err);
        callback(false);
        return;
      } else if (!res) {
        callback(false);
        return;
      }
      callback(utils.decrypt(res.slack_slash_token) === token);
    });
}

function createOauthIntegration(db, data, callback) {
  const insert = lodash.clone(data);
  insert.token = utils.encrypt(insert.token);
  insert.permissions = JSON.stringify(insert.permissions);
  
  queryHelper.insert('oauth_integrations', insert, callback);
}

function getOauthIntegrationById(db, oauthId, callback) {
  queryHelper.selectOne(db, 'oauth_integrations', { id: oauthId }, (err, res) => {
    if (err) {
      callback(err);
      return;
    }
    const parsed = lodash.cloneDeep(res);
    parsed.token = utils.decrypt(parsed.token);
    try {
      parsed.permissions = JSON.parse(parsed.permissions)
    } catch (e) {
      logger.warn(`Error parsing oauth_integration ${oauthId} permissions`, parsed.permissions);
    }
    callback(null, parsed);
  });
}

function processOAuth(db, queryParams, callback) {
  const data = {
    form: {
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code: queryParams.code
    }
  };
  async.autoInject({
    auth: (cb) => {
      request.post('https://slack.com/api/oauth.access', data, (err, response, body) => {
        if (err) {
          cb(err);
          return;
        } else if (response.statusCode !== 200) {
          logger.warn('OAuth Failed', response);
          cb(new errors.HttpStatusError(response.statusCode));
          return;
        }
        cb(null, JSON.parse(body));
      });
    },
    team: (auth, cb) => {
      const slack = new Slack(auth.access_token);
      slack.api('team.info', (err, response) => {
        if (err) {
          cb(err);
          return;
        }
        if (response.error) {
          logger.info(`No extra team info for ${auth.team_id} - ${response.error}`);
          cb(null, null);
        }
        cb(null, response.team);
      });
    },
    store: (auth, team, cb) => {
      const insertData = {
        team_id: auth.team_id,
        team_name: auth.team_name,
        token: auth.access_token,
        permissions: auth.permissions,
        installer_user_id: auth.installer_user_id,
        app_id: auth.app_id,
        app_user_id: auth.app_user_id,
        domain: lodash.get(team, 'domain', null),
        webhook_url: lodash.get(auth, 'incoming_webhook.url', null),
        webhook_channel: lodash.get(auth, 'incoming_webhook.channel', null),
        webhook_config_url: lodash.get(auth, 'incoming_webhook.configuration_url', null)
      };
      module.exports.createOauthIntegration(db, insertData, cb);
    }
  }, callback);
}

module.exports = {
  validateTeamToken: validateTeamToken,
  createOauthIntegration: createOauthIntegration,
  getOauthIntegrationById: getOauthIntegrationById,
  processOAuth: processOAuth
};
