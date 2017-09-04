'use strict';

const moment = require('moment');
const lodash = require('lodash');
const errors = require('common-errors');
const logger = require('./logger');

function trimChar(str, char) {
  let regx = new RegExp('^'+ char + '+|' + char + '+$', 'g');
  return str.replace(regx, '');
}

function textForDate(date) {
  let dayText = moment(date).format('dddd, MMM D');
  if (moment(date).isSame(moment(), 'day')) {
    dayText = 'today';
  } else if (moment(date).isSame(moment().add(1, 'days'), 'day')) {
    dayText = 'tomorrow';
  } else if (moment(date).isSame(moment().subtract(1, 'days'), 'day')) {
    dayText = 'yesterday';
  }
  return dayText;
}

function dateForText(text) {
  if (!text || typeof (text) !== 'string') return moment().toDate();

  let date;
  if (text.toLowerCase() === 'tomorrow') {
    date = moment().add(1, 'd');
  } else if (text.toLowerCase() === 'yesterday') {
    date = moment().subtract(1, 'd');
  } else {
    date = moment(text).isValid() ? moment(text) : moment();
  }
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
  if (lastChar.toLowerCase() === 's') {
    return str;
  }
  return str.concat('s');
}

function camelCaseKeys(collection) {
  if (lodash.isPlainObject(collection) ||
    (lodash.isObject(collection) && collection.constructor)) {
    return lodash.fromPairs(lodash.map(collection, (value, key) => (
      [lodash.camelCase(key), camelCaseKeys(value)]
    )));
  } else if (lodash.isArray(collection)) {
    return collection.map(camelCaseKeys);
  }
  return collection;
}

function snakeCaseKeys(collection) {
  if (lodash.isPlainObject(collection)) {
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
  if (!err) {
    return httpError;
  } else if (lodash.includes(['1054', '1171', '1263'], err.code)) {
    // mysql error codes https://www.briandunning.com/error-codes/?source=MySQL
    httpError = new errors.HttpStatusError(400, err.message);
  } else if (err.name === 'HttpStatusError') {
    httpError = err;
  } else if (err.statusCode && err.message) {
    httpError = new errors.HttpStatusError(err.statusCode, err.message);
  } else {
    httpError = err;
  }

  return httpError;
}

function processResponse(paramErr, result, response) {
  let err = paramErr;
  if (!err && result) {
    logger.debug('request.status.200', camelCaseKeys(result));
    response.status(200).json(camelCaseKeys(result)).end();
  } else {
    err = handleDatabaseError(err);
    const statusCode = err && err.statusCode ? err.statusCode : 500;
    let message = err && err.message ? err.message : 'Whoops, something unexpected happened...';
    if (statusCode === 500 && err && err.code) {
      message = 'Whoops, something unexpected happened...';
    }

    logger.debug(`request.status.${statusCode}`);
    response.status(statusCode).json({ text: message }).end();
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
  processResponse: processResponse
};
