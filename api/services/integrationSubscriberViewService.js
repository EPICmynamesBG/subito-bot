'use strict';

const lodash = require('lodash');
const utils = require('../helpers/utils');
const queryHelper = require('../helpers/queryHelper');

function _map(row) {
  if (!row) return;
  if (!lodash.isPlainObject(row.timezone)) {
    row.timezone = JSON.parse(row.timezone);
  }
  return row;
}

function _mapDecrypt(row) {
  if (!row) return;
  row.slack_slash_token = utils.decrypt(row.slack_slash_token);
  if (!lodash.isPlainObject(row.timezone)) {
    row.timezone = JSON.parse(row.timezone);
  }
  return row;
}

function getAll(db, decrypt = false, callback) {
  if (typeof decrypt === 'function') {
    callback = decrypt; // eslint-disable-line no-param-reassign
    decrypt = false; // eslint-disable-line no-param-reassign
  }
  queryHelper.select(db, 'integration_subscriber_view', (err, rows) => {
    if (decrypt) callback(err, rows ? rows.map(_mapDecrypt) : []);
    else callback(err, rows ? rows.map(_map) : []);
  });
}

module.exports = {
  getAll: getAll
}
