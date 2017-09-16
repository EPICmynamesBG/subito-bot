'use strict';

const queryHelper = require('../helpers/queryHelper');
const utils = require('../helpers/utils');

function _mapDecrypt(row) {
  if (!row) return;
  row.slack_slash_token = utils.decrypt(row.slack_slash_token);
  row.slack_webhook_url = utils.decrypt(row.slack_webhook_url);
  row.metadata = row.metadata ? utils.decrypt(row.metadata) : null;
  return row;
}

function addIntegration(db, integrationObj, callback) {
  const snaked = utils.snakeCase(integrationObj);
  if (typeof snaked.team_id !== 'string' ||
      snaked.team_id.length !== 9) {
    process.nextTick(callback, new Error('teamId must be a 9 character string'));
    return;
  }
  const toCreate = {
    team_id: snaked.team_id,
    team_domain: snaked.team_domain,
    slack_slash_token: utils.encrypt(snaked.slash_token),
    slack_webhook_url: utils.encrypt(snaked.webhook_url),
    metadata: snaked.metadata ? utils.encrypt(snaked.metadata) : null
  };
  queryHelper.insert(db, 'team_integrations', toCreate, callback);
}

function getAllIntegrations(db, decrypt = false, callback) {
  if (typeof decrypt === 'function') {
    /* eslint-disable no-param-reassign */
    callback = decrypt;
    decrypt = false;
    /* eslint-enable no-param-reassign */
  }
  queryHelper.select(db, 'team_integrations', (err, res) => {
    if (err) {
      callback(err);
      return;
    }
    if (decrypt) {
      res = res.map(_mapDecrypt); // eslint-disable-line no-param-reassign
    }
    callback(err, res);
  });
}

function getIntegrationById(db, teamId, decrypt = false, callback) {
  if (typeof decrypt === 'function') {
    /* eslint-disable no-param-reassign */
    callback = decrypt;
    decrypt = false;
    /* eslint-enable no-param-reassign */
  }
  queryHelper.selectOne(db, 'team_integrations', { team_id: teamId }, (err, res) => {
    if (err) {
      callback(err);
      return;
    }
    if (decrypt) {
      res = _mapDecrypt(res); // eslint-disable-line no-param-reassign
    }
    callback(err, res);
  });
}

function updateIntegration(db, teamId, fields, callback) {
  const snaked = utils.snakeCase(fields);
  const fieldsToUpdate = {};
  Object.keys(snaked).forEach((field) => {
    if (field === 'slash_token') {
      fieldsToUpdate.slack_slash_token = utils.encrypt(snaked[field])
    } else if (field === 'webhook_url') {
      fieldsToUpdate.slack_webhook_url = utils.encrypt(snaked[field])
    } else if (field === 'metadata' && snaked[field] !== null) {
      fieldsToUpdate.metadata = utils.encrypt(snaked.metadata);
    } else {
      fieldsToUpdate[field] = snaked[field];
    }
  });

  queryHelper.update(db, 'team_integrations', fieldsToUpdate,
    { team_id: teamId }, callback);
}

function removeIntegration(db, teamId, callback) {
  queryHelper.deleteOne(db, 'team_integrations', { team_id: teamId }, callback);
}

module.exports = {
  addIntegration: addIntegration,
  getAllIntegrations: getAllIntegrations,
  getIntegrationById: getIntegrationById,
  updateIntegration: updateIntegration,
  removeIntegration: removeIntegration
};
