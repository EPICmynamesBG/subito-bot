'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const moment = require('moment');
const config = require('../../config/config');
const soupCalendarService = require('../services/soupCalendarService');

function getSoupsForDay(req, res) {
  const params = utils.getSwaggerParams(req);
  const date = utils.dateForText(params.day);
  soupCalendarService.getSoupsForDay(req.db, date, (err, soupDay) => {
    if (err) {
      utils.processResponse(err, null, res);
      return;
    }
    if (!soupDay) {
      const message = `Soups for ${utils.textForDate(date)} not found`;
      utils.processResponse(null, { text: message }, res);
      return;
    }

    utils.processResponse(null, soupDay, res);
  });
}

function getAllSoups(req, res) {
  soupCalendarService.getAllSoups(req.db, (err, soups) => {
    utils.processResponse(err, soups, res);
  });
}

module.exports = {
  getSoupsForToday: getSoupsForDay,
  getSoupsForDay: getSoupsForDay,
  getAllSoups: getAllSoups
};
