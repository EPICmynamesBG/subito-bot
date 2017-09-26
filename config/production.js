'use strict';

require('dotenv').config({ silent: true });

const fs = require('fs');

module.exports = {
  NODE_ENV: 'production',

  LOGGING_LEVEL: 'analytics',

  SSL_PORT: process.env.SSL_PORT,
    
  SSL_PRIV_KEY: process.env.SSL_PRIV_KEY ? fs.readFileSync(process.env.SSL_PRIV_KEY, 'utf8') : null,
  
  SSL_CERT: process.env.SSL_CERT ? fs.readFileSync(process.env.SSL_CERT, 'utf8') : null,
  
  SWAGGER: {
    
    APP_VERSION: '4.0.1',
    
    HOSTNAME: process.env.HOST || 'localhost',
    
    PORT: process.env.PORT || 10010,
    
    BASEPATH: '/subito',
    
    SCHEMAS: ['http']
    
  }
};
