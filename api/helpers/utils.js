'use strict';

const moment = require('moment');

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

module.exports = {
  trimChar: trimChar,
  textForDate: textForDate,
  dateForText: dateForText
}
