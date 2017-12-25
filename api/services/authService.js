'use strict';

const queryHelper = require('../helpers/queryHelper');
const utils = require('../helpers/utils');
const logger = require('../helpers/logger');

/**
 * Validates a Slack request to a registered Team
 * @author Brandon Groff <mynamesbg@gmail.com>
 * @param {object} db
 * @param {string} teamId   Slack team id
 * @param {string} token    the Slack slash command token
 * @param {function} callback callback function with 1 param: true/false
 * @deprecated
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

module.exports = {
  validateTeamToken: validateTeamToken
};
