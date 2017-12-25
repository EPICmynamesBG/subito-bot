'use strict';

const lodash = require('lodash');
const errors = require('common-errors');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const ADMIN_AUTH_SECRET = require('../../config/config').ADMIN_AUTH_SECRET;

function bindDb(app, db) {
  return function (req, res, next) {
    req.app = app;
    req.db = db; // add db to request
    next();
  };
}

function logging(req, res, next) {
  logger.analytics(`${req.protocol}:/${req.url}`, req.body);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.analytics('request.duration', `${req.protocol}:/${req.url} - ${duration}ms`);
    logger.analytics('response.statusCode', `${req.protocol}:/${req.url} - (${res.statusCode})`);
  });
  next();
}

function camelCaseBody(req, res, next) {
  req.body = utils.camelCase(req.body);
  next();
}

// DEPRECATED
function adminAuth(req, res, next) {
  const params = lodash.get(req, 'swagger.params', {});
  const authRequired = Object.keys(params).includes('authorization');
  if (!authRequired) {
    next();
    return;
  }
  const authRegex = /Bearer\s(.*)/ig;
  const auth = req.swagger.params.authorization.value;
  if (!auth) {
    utils.processResponse(new errors.HttpStatusError(401, 'Missing Authorization'), null, res);
    return;
  }
  const token = authRegex.exec(auth)[1];
  if (!token) {
    utils.processResponse(new errors.HttpStatusError(401, 'Missing Authorization'), null, res);
    return;
  } else if (token !== ADMIN_AUTH_SECRET) {
    utils.processResponse(new errors.HttpStatusError(403, 'Invalid Authorization'), null, res);
    return;
  }
  next();
}

module.exports = {
  bindDb: bindDb,
  logging: logging,
  camelCaseBody: camelCaseBody,
  adminAuth: adminAuth
};
