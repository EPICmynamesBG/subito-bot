'use strict';

require('dotenv').config({ silent: true });

const config = {
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',

  DATABASE_USER: process.env.DATABASE_USER || '',

  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',

  DATABASE_NAME: process.env.DATABASE_NAME || '',

  PORT: process.env.PORT || 10010,

  USE_SSL: false,

  TEST_DATABASE_HOST: process.env.TEST_DATABASE_HOST || 'localhost', // TODO: Deprecated?

  TEST_DATABASE_USER: process.env.TEST_DATABASE_USER || '', // TODO: Deprecated?

  TEST_DATABASE_PASSWORD: process.env.TEST_DATABASE_PASSWORD || '', // TODO: Deprecated?

  TEST_DATABASE_NAME: process.env.TEST_DATABASE_NAME || '', // TODO: Deprecated?

  SLACK_SLASH_TOKEN: process.env.SLACK_SLASH_TOKEN || '', // TODO: Deprecated?

  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '', // TODO: Deprecated?

  SLACK_API_TOKEN: process.env.SLACK_API_TOKEN || '', // TODO: Deprecated?

  SLACK_NOTIFY_ERROR_USER : process.env.SLACK_NOTIFY_ERROR_USER, // TODO: Deprecated?

  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,

  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,

  SLACK_VERIFICATION_TOKEN: process.env.SLACK_VERIFICATION_TOKEN,

  SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET, // TODO: deprecate

  NODE_ENV: process.env.NODE_ENV || 'development',

  LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'debug',

  LOG_DIR: './logs',

  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'America/Indiana/Indianapolis',

  SWAGGER: {

    APP_VERSION: '6.1.0',

    HOSTNAME: process.env.HOST || 'localhost',

    PORT: process.env.PORT || 10010,

    BASEPATH: '/subito',

    SCHEMAS: ['http']

  }
};

if (config.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  Object.assign(config, require('./test'));
} else if (config.NODE_ENV === 'production') {
  // eslint-disable-next-line global-require
  Object.assign(config, require('./production'));
  config.USE_SSL = (config.SSL_PORT && config.SSL_PRIV_KEY && config.SSL_CERT);
  if (config.USE_SSL) {
    config.SWAGGER.SCHEMAS = ['https'];
    config.SWAGGER.PORT = config.SSL_PORT;
  }
}

module.exports = config;
