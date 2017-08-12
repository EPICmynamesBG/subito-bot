'use strict';

require('dotenv').config({ silent: true });
const util = require('util');

const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const config = require('./config/config');

const app = express();
// will support such content type application/json at same time
app.use(bodyParser.json({
  type: ['application/json']
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ maxAge: 600 }));

const db = mysql.createConnection(config.DATABASE_URI);
//db.queryFormat = function (query, values) {
//  if (!values) return query;
//  return query.replace(/\:(\w+)/g, function (txt, key) {
//    if (values.hasOwnProperty(key)) {
//      return this.escape(values[key]);
//    }
//    return txt;
//  }.bind(this));
//};
db.connect((err) => { if (!err) console.log('DB connected')});

app.use((paramReq, res, next) => {
  const req = paramReq;
  req.app = app;
  req.db = db; // add db to request
  next();
});

var seConfig = { appRoot: __dirname };

SwaggerExpress.create(seConfig, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);
  console.info("\x1b[32m", util.format('Express running on port %s', port), "\x1b[0m");
});

module.exports = app;
