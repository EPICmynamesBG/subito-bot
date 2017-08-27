'use strict';

const async = require('async');
const mysql = require('mysql');
const moment = require('moment');
const logger = require('../api/helpers/logger');

const db = require('../config/db');

function processCliArgs() {
  const params = {};
  const regx = /\-\-(.*)=(.*)/g;
  process.argv.forEach((arg) => {
    const matches = regx.exec(arg);
    if (matches) {
      params[matches[1]] = matches[2];
    }
  });
  return params;
}

function migrateUp() {
  
}

function migrateDown() {
  
}

function main() {
  const args = processCliArgs();

  if (arg.dir === 'up') {
    migrateUp();
  } else if (args.dir === 'down') {
    migrateDown();
  } else {
    console.error('Migration direction invalid or unspecified');
    return process.exit(1);
  }
  process.exit(0);
}

main();
