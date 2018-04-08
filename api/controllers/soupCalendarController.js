'use strict';

const utils = require('../helpers/utils');
const soupCalendarViewService = require('../services/soupCalendarViewService');
const soupCalendarService = require('../services/soupCalendarService');

function getSoupsForDay(req, res) {
  const params = utils.getSwaggerParams(req);
  const date = utils.dateForText(params.day);
  soupCalendarViewService.getSoupsForDay(req.db, date, (err, soupDay) => {
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

function getSoupsForWeek(req, res) {
  const params = utils.getSwaggerParams(req);
  const date = utils.dateForText(params.day);
  soupCalendarViewService.getSoupsForWeek(req.db, date, (err, soups) => {
    if (err) {
      utils.processResponse(err, null, res);
      return;
    }
    if (!soups || soups.length === 0) {
      const message = `Soups for week of ${utils.textForDate(date)} not found`;
      utils.processResponse(null, { text: message }, res);
      return;
    }

    utils.processResponse(null, soups, res);
  });
}

function getAllSoups(req, res) {
  soupCalendarViewService.getAllSoups(req.db, (err, soups) => {
    utils.processResponse(err, soups, res);
  });
}

function _buildSearchResponse(searchStr, soups) {
  if (!soups || soups.length === 0) {
    return `Looks like no upcoming dates were found for _${searchStr}_.`;
  }
  let response = `Soups found! Here are some upcoming dates for _${searchStr}_`;
  soups.forEach((soupCal) => {
    response = response.concat(`\n>${soupCal.day} : ${soupCal.soup}`);
  });
  return response;
}

function search(req, res) {
  const params = utils.getSwaggerParams(req);
  soupCalendarService.searchForSoup(req.db, params.search, (err, soups) => {
    if (req.fromSlack) {
      const formatted = {
        soups: soups,
        text: _buildSearchResponse(params.search, soups)
      };
      utils.processResponse(err, formatted, res);
      return;
    }
    utils.processResponse(err, soups, res);
  });
}

module.exports = {
  getSoupsForToday: getSoupsForDay,
  getSoupsForDay: getSoupsForDay,
  getAllSoups: getAllSoups,
  search: search,
  getSoupsForWeekToday: getSoupsForWeek,
  getSoupsForWeek: getSoupsForWeek
};
