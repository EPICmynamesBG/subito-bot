'use strict';

const moment = require('moment');
const lodash = require('lodash');
const errors = require('common-errors');
const crypto = require('crypto-js');
const logger = require('./logger');

const ENCRYPTION_KEY = require('../../config/config').ENCRYPTION_KEY;

function trimChar(str, char) {
  let regx = new RegExp('^'+ char + '+|' + char + '+$', 'g');
  return str.replace(regx, '');
}

function textForDate(date) {
  let dayText = moment(date).format('dddd, MMM D');
  if (moment(date).isSame(moment(), 'day')) dayText = 'today';
  else if (moment(date).isSame(moment().add(1, 'days'), 'day')) dayText = 'tomorrow';
  else if (moment(date).isSame(moment().subtract(1, 'days'), 'day')) dayText = 'yesterday';

  return dayText;
}

function dateForText(text) {
  if (!text || typeof (text) !== 'string') return moment().toDate();

  let date;
  if (text.toLowerCase() === 'tomorrow') date = moment().add(1, 'd');
  else if (text.toLowerCase() === 'yesterday') date = moment().subtract(1, 'd');
  else date = moment(text).isValid() ? moment(text) : moment();
  return date.toDate();
}

function getSwaggerParams(req) {
  const raw = lodash.get(req, 'swagger.params', {});
  let params = {};
  lodash.forEach(raw, (val, key) => {
    params[key] = lodash.get(val, 'value', null);
  });
  return params;
}

function pluralize(str) {
  const lastChar = str.charAt(str.length - 1);
  if (lastChar.toLowerCase() === 's') return str;
  return str.concat('s');
}

function camelCaseKeys(collection) {
  if (lodash.isPlainObject(collection) ||
    (lodash.isObject(collection) && !lodash.isArray(collection) &&
      lodash.get(collection, 'constructor.name', null) !== 'Date')) {
    return lodash.fromPairs(lodash.map(collection, (value, key) => (
      [lodash.camelCase(key), camelCaseKeys(value)]
    )));
  } else if (lodash.isArray(collection)) {
    return collection.map(camelCaseKeys);
  }
  return collection;
}

function snakeCaseKeys(collection) {
  if (lodash.isPlainObject(collection)  ||
    (lodash.isObject(collection) && !lodash.isArray(collection) &&
      lodash.get(collection, 'constructor.name', null) !== 'Date')) {
    return lodash.fromPairs(lodash.map(collection, (value, key) => (
      [lodash.snakeCase(key), snakeCaseKeys(value)]
    )));
  } else if (lodash.isArray(collection)) {
    return collection.map(snakeCaseKeys);
  }
  return collection;
}

function handleDatabaseError(err) {
  let httpError = null;
  // mysql error codes https://www.briandunning.com/error-codes/?source=MySQL
  if (!err) return httpError;
  else if (lodash.includes(['1054', '1171', '1263', 'ER_BAD_FIELD_ERROR'], err.code))
    httpError = new errors.HttpStatusError(400, err.message);
  else if (err.name === 'HttpStatusError') httpError = err;
  else if (err.statusCode && err.message) httpError = new errors.HttpStatusError(err.statusCode, err.message);
  else httpError = err;

  return httpError;
}

function processResponse(paramErr, result, response) {
  let err = paramErr;
  if (!err && result) {
    response.status(200).json(camelCaseKeys(result)).end();
  } else {
    err = handleDatabaseError(err);
    const statusCode = err && err.statusCode ? err.statusCode : 500;
    let message = err && err.message ? err.message : 'Whoops, something unexpected happened...';
    if (statusCode === 500 && err && err.code) {
      message = 'Whoops, something unexpected happened...';
    }
    logger.analytics('api.error', statusCode, message);
    response.status(statusCode).json({ text: message }).end();
  }
}

function processResponseCb(response) {
  return (paramErr, result) => {
    module.exports.processResponse(paramErr, result, response);
  };
}

function textCleaner(str) {
  // 1: Remove double/extra spaces
  let cleaned = str.replace(/\\n{2,}/g, '\n');
  // 2: add spaces where needed
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2");
  // 3: Remove special chars
  cleaned = cleaned.replace(/\n|\*/g, '');
  return cleaned;
}

function encrypt(thing) {
  let clone = lodash.cloneDeep(thing);
  if (typeof thing !== 'string') clone = JSON.stringify(clone);
  try {
    const result = crypto.AES.encrypt(clone, ENCRYPTION_KEY).toString();
    return result;
  } catch (e) {
    logger.warn('Encryption error', e);
    return null;
  }
}

function decrypt(thing) {
  let clone = lodash.cloneDeep(thing);
  if (typeof thing !== 'string') {
    logger.warn('Decrypt was not passed a string!', thing);
    clone = JSON.stringify(clone);
  }

  try {
    const result = crypto.AES.decrypt(clone, ENCRYPTION_KEY).toString(crypto.enc.Utf8);
    return result;
  } catch (e) {
    logger.warn('Decryption error', e);
    return null;
  }
}

module.exports = {
  trimChar: trimChar,
  textForDate: textForDate,
  dateForText: dateForText,
  pluralize: pluralize,
  camelCase: camelCaseKeys,
  snakeCase: snakeCaseKeys,
  getSwaggerParams: getSwaggerParams,
  handleDatabaseError: handleDatabaseError,
  processResponse: processResponse,
  processResponseCb: processResponseCb,
  textCleaner: textCleaner,
  encrypt: encrypt,
  decrypt: decrypt
};
