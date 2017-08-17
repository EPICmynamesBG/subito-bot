const winston = require('winston');
const loggingLevel = require('../../config/config').LOGGING_LEVEL;
const logDir = require('../../config/config').LOG_DIR;
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = new (winston.Logger)({
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

module.exports = logger;
