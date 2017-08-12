const winston = require('winston');
const loggingLevel = require('../../config/config').LOGGING_LEVEL;
const logFile = require('../../config/config').LOG_FILE;
const fs = require('fs');

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

const logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({
      level: loggingLevel,
      filename: logFile,
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
