'use strict';

module.exports = {  
  DATABASE_URI: process.env.DATABASE_URI || '',
  
  SLACK_SLASH_TOKEN: process.env.SLACK_SLASH_TOKEN || '',

  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
 
  SLACK_API_TOKEN: process.env.SLACK_API_TOKEN || '',

  LOGGING_LEVEL: 'debug',

  LOG_FILE: './logs/all-logs.log',
}
