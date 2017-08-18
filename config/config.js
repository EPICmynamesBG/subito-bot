'use strict';

module.exports = {  
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  
  DATABASE_USER: process.env.DATABASE_USER || '',
  
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
  
  DATABASE_NAME: process.env.DATABASE_NAME || '',
  
  SLACK_SLASH_TOKEN: process.env.SLACK_SLASH_TOKEN || '',

  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
 
  SLACK_API_TOKEN: process.env.SLACK_API_TOKEN || '',
  
  NODE_ENV: process.env.NODE_ENV || 'development',

  LOGGING_LEVEL: 'debug',

  LOG_DIR: './logs',
}
