'use strict';

require('dotenv').config({ silent: true });

module.exports = {
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',

  DATABASE_USER: process.env.DATABASE_USER || '',

  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',

  DATABASE_NAME: process.env.DATABASE_NAME || '',

  TEST_DATABASE_HOST: process.env.TEST_DATABASE_HOST || 'localhost',

  TEST_DATABASE_USER: process.env.TEST_DATABASE_USER || '',

  TEST_DATABASE_PASSWORD: process.env.TEST_DATABASE_PASSWORD || '',

  TEST_DATABASE_NAME: process.env.TEST_DATABASE_NAME || '',

  TEST_CONSOLE_LOGGING: process.env.TEST_CONSOLE_LOGGING &&
    process.env.TEST_CONSOLE_LOGGING.toLowerCase() === 'true' ? true : false,

  SLACK_SLASH_TOKEN: process.env.SLACK_SLASH_TOKEN || '',

  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',

  SLACK_API_TOKEN: process.env.SLACK_API_TOKEN || '',

  SLACK_NOTIFY_ERROR_USER : process.env.SLACK_NOTIFY_ERROR_USER,

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  NODE_ENV: process.env.NODE_ENV || 'development',

  LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'debug',

  LOG_DIR: './logs'
}
