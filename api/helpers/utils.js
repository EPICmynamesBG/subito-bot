'use strict';

const moment = require('moment');

function trimChar(str, char) {
  let regx = new RegExp('^'+ char + '+|' + char + '+$', 'g');
  return str.replace(regx, '');
}

function textForDate(date) {
  let dayText = moment(date).format('dddd, MMM D');
  if (moment(date).isSame(moment(), 'day')) {
    dayText = 'Today';
  } else if (moment(date).isSame(moment().add(1, 'd')), 'day') {
    dayText = 'Tomorrow';
  } else if (moment(date).isSame(moment().subtract(1, 'd')), 'day') {
    dayText = 'Yesterday';
  }
  return dayText;
}

function dateForText(text) {
  let date = moment(text);.isValid() ? moment(text) : moment();
  if (text.toLowerCase() === 'tomorrow') {
    date = moment().add(1, 'd');
  } else if (text.toLowerCase() === 'yesterday') {
    date = moment().subtract(1, 'd');
  }
  return date.toDate();
}

module.exports = {
  trimChar: trimChar,
  textForDate: textForDate,
  dateForText: dateForText
}
