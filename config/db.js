'use strict';

const mysql = require('mysql');
const async = require('async');
const config = require('./config');
const logger = require('../api/helpers/logger');

const dbConfig = {
  connectionLimit: 15,
  host: config.DATABASE_HOST,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  database: config.DATABASE_NAME,
  multipleStatements: config.NODE_ENV === 'test'
};

function DB() {
  this.pool = mysql.createPool(dbConfig);

  const onEnd = function (options, err) {
    this.pool.end((poolErr) => {
      if (options.clean) logger.debug('Clean pool close');
      if (poolErr) logger.error(poolErr);
      if (err) logger.error(err);
      if (options.exit) process.exit(options.code || 0);
    });
  };

  process.stdin.resume(); //so the program will not close instantly

  //do something when app is closing
  process.on('exit', onEnd.bind(this, {
    clean: true,
    code: 0
  }));

  //catches ctrl+c event
  process.on('SIGINT', onEnd.bind(this, {
    exit: true,
    code: 0
  }));

  //catches uncaught exceptions
  process.on('uncaughtException', onEnd.bind(this, {
    exit: true,
    code: 1
  }));

  this.pool.on('acquire', (connection) => {
    logger.silly('Connection %d acquired', connection.threadId);
  });

  this.pool.on('connection', (connection) => {
    logger.silly('Connection %d acquired', connection.threadId);
  });

  this.pool.on('enqueue', () => {
    logger.silly('Pool Enqueue: Waiting for available connection slot');
  });

  this.pool.on('release', (connection) => {
    logger.silly('Connection %d released', connection.threadId);
  });
}

DB.prototype.query = function (query, paramArr, callback) {
  let dbConnection;
  async.waterfall([
    (cb) => {
      this.pool.getConnection(cb);
    },
    (connection, cb) => {
      dbConnection = connection;
      dbConnection.query(query, paramArr, cb);
    }
  ], (err, results) => {
    if (dbConnection) dbConnection.release();
    if (err) {
      logger.error('DB.Query', err);
      logger.debug('DB.Query.Error', query, paramArr);
      callback(err);
      return;
    }
    callback(err, results);
  });
}

module.exports = new DB();
