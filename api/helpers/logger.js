const winston = require('winston');
const env = require('../../config/config').NODE_ENV;
const loggingLevel = require('../../config/config').LOGGING_LEVEL;
const logDir = require('../../config/config').LOG_DIR;
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const CUSTOM_LEVELS = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    analytics: 4,
    verbose: 5,
    debug: 6,
    silly: 7
  },
  colors: {
    fatal: 'white',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    analytics: 'cyan',
    verbose: 'gray',
    debug: 'blue',
    silly: 'magenta'
  }
};

let transports;

if (env === 'test') {
  transports = [
    new winston.transports.File({
      name: 'file#debug',
      level: 'debug',
      levels: CUSTOM_LEVELS.levels,
      filename: logDir + '/test.log',
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: false,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      timestamp: true
    }),
    new winston.transports.Console({
      level: loggingLevel,
      levels: CUSTOM_LEVELS.levels,
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: false,
      json: false,
      colorize: true,
      timestamp: true
    })
  ];
} else {
  transports = [
    new winston.transports.File({
      name: 'file#debug',
      level: 'debug',
      levels: CUSTOM_LEVELS.levels,
      filename: logDir + '/debug.log',
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      timestamp: true
    }),
    new winston.transports.File({
      name: 'file#analytics',
      level: 'analytics',
      levels: CUSTOM_LEVELS.levels,
      filename: logDir + '/analytics.log',
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: false,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: true,
      timestamp: true
    }),
    new winston.transports.File({
      name: 'file#error',
      filename: logDir + '/error.log',
      level: 'error',
      levels: CUSTOM_LEVELS.levels,
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      timestamp: true
    }),
    new winston.transports.Console({
      level: loggingLevel,
      levels: CUSTOM_LEVELS.levels,
      exceptionsLevel: CUSTOM_LEVELS.levels.fatal,
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true
    })
  ];
}

const logger = new (winston.Logger)({
  colors: CUSTOM_LEVELS.colors,
  level: loggingLevel,
  levels: CUSTOM_LEVELS.levels,
  transports: transports,
  exitOnError: false
});

module.exports = logger;
