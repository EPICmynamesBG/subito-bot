const winston = require('winston');
const env = require('../../config/config').NODE_ENV;
const loggingLevel = require('../../config/config').LOGGING_LEVEL;
const logDir = require('../../config/config').LOG_DIR;
const TEST_CONSOLE_LOGGING = require('../../config/config').TEST_CONSOLE_LOGGING;
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

let logger;

if (env === 'test') {
  const testTransports = [
    new winston.transports.File({
      name: 'file#debug',
      level: 'debug',
      filename: logDir + '/test.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      timestamp: true
    })];
  if (TEST_CONSOLE_LOGGING) {
    testTransports.push(new winston.transports.Console({
      level: loggingLevel,
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true
    }));
  }
  logger = new(winston.Logger)({
    transports: testTransports,
    exitOnError: false
  });
} else {
  logger = new(winston.Logger)({
    transports: [
    new winston.transports.File({
        name: 'file#debug',
        level: 'debug',
        filename: logDir + '/debug.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        timestamp: true
      }),
    new winston.transports.File({
        name: 'file#error',
        filename: logDir + '/error.log',
        level: 'error',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        timestamp: true
      }),
    new winston.transports.Console({
        level: loggingLevel,
        handleExceptions: true,
        json: false,
        colorize: true,
        timestamp: true
      })],
    exitOnError: false
  });
}

module.exports = logger;
