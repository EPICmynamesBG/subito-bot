'use strict';


const logger = require('../helpers/logger');
const utils = require('../helpers/utils');

function bindDb(app, db) {
  return function (req, res, next) {
    req.app = app;
    req.db = db; // add db to request
    next();
  };
}

function logging(req, res, next) {
  logger.debug(`${req.protocol}:/${req.url}`, req.body);
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


module.exports = {
  bindDb: bindDb,
  logging: logging,
  camelCaseBody: camelCaseBody
};
