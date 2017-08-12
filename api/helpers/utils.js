'use strict';

function trimChar(str, char) {
  let regx = new RegExp('^'+ char + '+|' + char + '+$', 'g');
  return str.replace(regx, '');
}

module.exports = {
  trimChar: trimChar
}
