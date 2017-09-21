'use strict';

require('dotenv').config({ silent: true });

module.exports = {
  NODE_ENV: 'test',
  
  LOGGING_LEVEL: 'warn',
  
  USE_SSL: false,
  
  DATABASE_HOST: process.env.TEST_DATABASE_HOST,
  
  DATABASE_USER: process.env.TEST_DATABASE_USER,
  
  DATABASE_PASSWORD: process.env.TEST_DATABASE_PASSWORD,
  
  DATABASE_NAME: process.env.TEST_DATABASE_NAME,
  
  ADMIN_AUTH_SECRET: 'HelloWorld',
  
  SWAGGER: {
    
    APP_VERSION: '0.0.1',
    
    HOSTNAME: process.env.HOST || 'localhost',
    
    PORT: process.env.PORT || 10010,
    
    BASEPATH: '/subito',
    
    SCHEMAS: ['http']
    
  }
};
