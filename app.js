'use strict';

const util = require('util');
const bodyParser = require('body-parser');
const cors = require('cors');
const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const config = require('./config/config');
const middleware = require('./api/middleware/middleware');
const logger = require('./api/helpers/logger');

if (config.NODE_ENV === 'development' ||
   config.NODE_ENV === 'test') {
  require('pretty-error').start();
}

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  Object.assign(require('./config/config'), require('./config/test'));
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

SwaggerExpress.create(seConfig, function(err, swaggerExpress) {
  if (err) { throw err; }

  const swaggerUi = require('swagger-tools/middleware/swagger-ui');
  app.use(swaggerUi(swaggerExpress.runner.swagger));
  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);
  logger.info(util.format('Express running on port %s', port));
});

module.exports = app;
