'use strict';

const parseSubito = require('../helpers/parseSubito');

function getSoupsForDay(req, res) {
  console.log('Hello World');
  parseSubito.fetchCalendar((err, data) => {
    console.log(err, data);
  });
  
  res.json('Hello World');
}

module.exports = {
  getSoupsForDay: getSoupsForDay
};
