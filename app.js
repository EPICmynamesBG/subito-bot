'use strict';

require('dotenv').config({ silent: true });
const util = require('util');

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var config = require('./config/config');

module.exports = app; // for testing

var config = { appRoot: __dirname };

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);
  console.info("\x1b[32m", util.format('Express running on port %s', port), "\x1b[0m");
});
