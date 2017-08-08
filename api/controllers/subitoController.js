'use strict';

const parseSubito = require('../helpers/parseSubito');
const lodash = require('lodash');

function getSoupsForDay(req, res) {
  console.log('Hello World');
  parseSubito.fetchCalendar((err, data) => {
    console.log(data);
  });
  
  res.json('Hello World');
}

module.exports = {
  getSoupsForDay: getSoupsForDay
};
