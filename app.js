'use strict';

const util = require('util');
const bodyParser = require('body-parser');
const cors = require('cors');
const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const config = require('./config/config');
const logger = require('./api/helpers/logger');
const middleware = require('./api/middleware/middleware');

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

var seConfig = { appRoot: __dirname };

let sslConfig = null;
if (config.SSL_PORT && config.SSL_PRIV_KEY && config.SSL_CERT) {
  sslConfig = {
    key: config.SSL_PRIV_KEY,
    cert: config.SSL_CERT
  };
}

SwaggerExpress.create(seConfig, function(err, swaggerExpress) {
  if (err) { throw err; }

  const swaggerUi = require('swagger-tools/middleware/swagger-ui');
  app.use(swaggerUi(swaggerExpress.runner.swagger));
  // install middleware
  swaggerExpress.register(app);

  app.listen(config.PORT);
  logger.info(util.format('Express running on port %s', config.PORT));

  if (config.NODE_ENV === 'production' && sslConfig) {
    app.listen(sslConfig, config.SSL_PORT);
    logger.info(util.format('Express running on port %s', config.SSL_PORT));
  }
});

module.exports = app;
