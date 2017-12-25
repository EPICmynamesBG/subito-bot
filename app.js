'use strict';

const https = require('https');
const util = require('util');
const bodyParser = require('body-parser');
const cors = require('cors');
const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const swaggerUi = require('swagger-tools/middleware/swagger-ui');
const swaggerMetadata = require('swagger-tools/middleware/swagger-metadata');
const config = require('./config/config');
const middleware = require('./api/middleware/middleware');
const logger = require('./api/helpers/logger');

if (config.NODE_ENV === 'development' ||
   config.NODE_ENV === 'test') {
  require('pretty-error').start();
}

const db = require('./config/db');

const app = express();
// will support such content type application/json at same time
app.use(bodyParser.json({
  type: ['application/json']
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ maxAge: 600 }));

app.use(middleware.bindDb(app, db));
app.use(middleware.logging);
app.use(middleware.camelCaseBody);
app.set('x-powered-by', false);

var seConfig = { appRoot: __dirname };

let sslConfig = null;
if (config.USE_SSL) {
  sslConfig = {
    key: config.SSL_PRIV_KEY,
    cert: config.SSL_CERT,
    ca: config.SSL_CA
  };
}

SwaggerExpress.create(seConfig, function(err, swaggerExpress) {
  if (err) { throw err; }

  app.use(swaggerMetadata(swaggerExpress.runner.swagger))
  app.use(swaggerUi(swaggerExpress.runner.swagger));
  app.use(middleware.adminAuth);
  // install middleware
  swaggerExpress.register(app);

  if (config.USE_SSL) {
    https.createServer(sslConfig, app).listen(config.SSL_PORT, (err) => {
      if (err) { logger.error(err); }
      else { logger.info(util.format('Express running on port %s', config.SSL_PORT)); }
    });
  } else {
    app.listen(config.PORT, (err) => {
      if (err) { logger.error(err); }
      else { logger.info(util.format('Express running on port %s', config.PORT)); }
    });
  }
});

module.exports = app;
