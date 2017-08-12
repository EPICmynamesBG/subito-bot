'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const moment = require('moment');
const config = require('../../config/config');
const soupCalendarService = require('../services/soupCalendarService');

function _slackValidation(req) {
  let token = lodash.get(req.swagger.params, 'body.value.token', null);
  if (!token) {
    return true;
  } else if (token === config.SLACK_SLASH_TOKEN) {
    return true;
  }
  return false;
}

function getSoupsForDay(req, res) {
  logger.debug(JSON.stringify(req.body));
  if (!_slackValidation(req)) {
    res.status(403).json({
      text: 'Invalid Slack token'
    });
    return;
  }
  let text = lodash.get(req.swagger.params, 'body.value.text', null);
  let date;

  if (text && text.toLowerCase() === 'tomorrow') {
    date = moment().add(1, 'd').format();
  } else if (text && moment(text).isValid()) {
    date = text;
  } else {
    date = lodash.get(req.swagger.params, 'body.value.day', new Date());
  }
  soupCalendarService.getSoupsForDay(req.db, date, (err, soupDay) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        text: 'An unexpected server error occured'
      });
      return;
    }
    if (!soupDay) {
      const message = `Soups for ${moment(date).format('YYYY-MM-DD')} not found`;
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
  getSoupsForDay: getSoupsForDay,
  getAllSoups: getAllSoups
};
