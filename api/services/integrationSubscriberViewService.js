'use strict';

const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');

function _mapDecrypt(row) {
  if (!row) return;
  row.slack_slash_token = utils.decrypt(row.slack_slash_token);
  row.slack_webhook_url = utils.decrypt(row.slack_webhook_url);
  return row;
}

function getAll(db, decrypt = false, callback) {
  if (typeof decrypt === 'function') {
    callback = decrypt; // eslint-disable-line no-param-reassign
    decrypt = false; // eslint-disable-line no-param-reassign
  }
  queryHelper.select(db, 'integration_subscriber_view', (err, rows) => {
    if (decrypt) callback(err, rows ? rows.map(_mapDecrypt) : []);
    else callback(err, rows ? rows : []);
  });
}

module.exports = {
  getAll: getAll
}
