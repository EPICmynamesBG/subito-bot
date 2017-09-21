'use strict';

require('dotenv').config({ silent: true });

const config = {  
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',

  DATABASE_USER: process.env.DATABASE_USER || '',

  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',

  DATABASE_NAME: process.env.DATABASE_NAME || '',
  
  PORT: process.env.PORT || 10010,
  
  USE_SSL: false,
  
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
  
  ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET,

  NODE_ENV: process.env.NODE_ENV || 'development',

  LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'debug',

  LOG_DIR: './logs',
  
  SWAGGER: {
    
    APP_VERSION: '3.1.2',
    
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
