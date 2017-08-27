'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const moment = require('moment');
const config = require('../../config/config');
const soupCalendarService = require('../services/soupCalendarService');

function _slackValidation(req) {
  const params = utils.getSwaggerParams(req);
  if (params.body.token === config.SLACK_SLASH_TOKEN) {
    return true;
  }
  return false;
}

function getSoupsForDay(req, res) {
  const params = utils.getSwaggerParams(req);
  logger.debug(req.url, params);
  const date = utils.dateForText(params.day);
  soupCalendarService.getSoupsForDay(req.db, date, (err, soupDay) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        text: 'An unexpected server error occured'
      });
      return;
    }
    if (!soupDay) {
      const message = `Soups for ${utils.textForDate(date)} not found`;
      logger.warn(200, message);
      res.status(200).json({
        text: message
      });
      return;
    }

    res.json(soupDay);
  });
}

function getAllSoups(req, res) {
  logger.debug(req.url);
  soupCalendarService.getAllSoups(req.db, (err, soups) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        text: 'An unexpected server error occured'
      });
      return;
    }
    res.json(soups);
  });
}

module.exports = {
  getSoupsForToday: getSoupsForDay,
  getSoupsForDay: getSoupsForDay,
  getAllSoups: getAllSoups
};
