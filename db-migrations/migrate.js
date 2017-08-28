'use strict';

require('dotenv').config({
  silent: true
});

const fs = require('fs');
const path = require('path');
const async = require('async');
const lodash = require('lodash');
const mysql = require('mysql');
const moment = require('moment');
const config = require('../config/config');
const logger = require('../api/helpers/logger');

let db;

function processCliArgs() {
  const params = {};
  const regx = /\-\-(.*)=(.*)/;
  process.argv.forEach((arg) => {
    const matches = regx.exec(arg);
    if (matches) {
      params[matches[1]] = matches[2];
    }
  });
  return params;
}

function processMigrationsFolder(callback) {
  const idNameMapRegex = /(\d*)\-(.*)\-(?:(up|down))\.sql/;
  fs.readdir(path.join('./db-migrations/sql'), 'utf8', (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    const mapped = files.map((filename) => {
      const temp = idNameMapRegex.exec(filename);
      return {
        filename: temp[0],
        id: temp[1],
        name: temp[2],
        direction: temp[3],
        applied: false
      };
    });
    callback(null, mapped);
  });
}

function determineChanges(migrationList, migrateDirection, callback) {
  const selectQry = 'SELECT * FROM migrations WHERE id = ?';
  const migrateUpList = migrationList.reduce((list, migration) => {
    if (migration.direction === migrateDirection) list.push(migration);
    return list;
  }, []);
  async.each(migrateUpList, (migration, cb2) => {
    db.query(selectQry, [migration.id], (err, res) => {
      if (err) {
        return cb2(err);
      }
      if (res.length === 0) {
        migration.applied = false;
      } else if (res.length === 1) {
        migration.applied = true;
      } else {
        return cb2(new Error(`Multiple migrations found for migration ${JSON.stringify(migration)}`));
      }
      cb2(null, migration);
    });
  }, (err) => {
    callback(err, migrateUpList);
  });
}

function migrateUp() {
  const insertQry = 'INSERT INTO migrations (id, name) VALUES (?, ?)';
  async.autoInject({
    migrationFiles: (cb) => {
      processMigrationsFolder(cb);
    },
    getCurrentAppliedMigrations: (migrationFiles, cb) => {
      determineChanges(migrationFiles, 'up', cb);
    },
    applyMigrations: (getCurrentAppliedMigrations, cb) => {
      async.each(getCurrentAppliedMigrations, (migration, cb2) => {
        if (migration.applied) {
          return cb2();
        } else {
          async.waterfall([
            (cb3) => {
              fs.readFile(path.join(`./db-migrations/sql/${migration.filename}`), 'utf8', cb3);
          },
            (fileQuery, cb3) => {
              logger.info(fileQuery);
              db.query(fileQuery, [], cb3);
          },
            (lastQuery, cb3) => {
              db.query(insertQry, [migration.id, migration.name], cb3);
          }
        ], cb2);
        }
      }, cb);
    }
  }, (err, res) => {
    if (err) {
      logger.error(err);
      return process.exit(1);
    }
    logger.info('All migrations applied');
    process.exit(0);
  });
}

function migrateDown() {
  const deleteQry = 'DELETE FROM migrations WHERE id = ?';
  async.autoInject({
    migrationFiles: (cb) => {
      processMigrationsFolder(cb);
    },
    getCurrentAppliedMigrations: (migrationFiles, cb) => {
      determineChanges(migrationFiles, 'down', cb);
    },
    applyMigrations: (getCurrentAppliedMigrations, cb) => {
      let lastMigration = null;
      for (var i = getCurrentAppliedMigrations.length - 1; i >= 0; i--) {
        const migration = getCurrentAppliedMigrations[i];
        if (migration.applied) {
          lastMigration = migration;
          break;
        }
      }
      if (!lastMigration) {
        return cb(null, null);
      }
      async.waterfall([
        (cb2) => {
          fs.readFile(path.join(`./db-migrations/sql/${lastMigration.filename}`), 'utf8', cb2);
          },
        (fileQuery, cb2) => {
          logger.info(fileQuery);
          db.query(fileQuery, [], cb2);
          },
        (lastQuery, cb2) => {
          db.query(deleteQry, [lastMigration.id], cb2);
      }], (err) => {
        cb(err, lastMigration);
      });
    }
  }, (err, results) => {
    if (err) {
      logger.error(err);
      return process.exit(1);
    }
    if (results.applyMigrations) {
      const migration = results.applyMigrations;
      logger.info(`Migration ${migration.name} (id: ${migration.id}) downgraded.`);
    } else {
      logger.info('No migrations to downgrade.');
    }
    process.exit(0);
  });
}

function main() {
  const args = processCliArgs();
  logger.debug(`Migrating ${args.dir} ${args.db} database...`);
  if (args.db === 'test') {
    config.DATABASE_HOST = config.TEST_DATABASE_HOST;
    config.DATABASE_USER = config.TEST_DATABASE_USER;
    config.DATABASE_PASSWORD = config.TEST_DATABASE_PASSWORD;
    config.DATABASE_NAME = config.TEST_DATABASE_NAME;
  }
  db = require('../config/db');

  if (args.dir === 'up') {
    migrateUp();
  } else if (args.dir === 'down') {
    migrateDown();
  } else {
    logger.error('Migration direction invalid or unspecified');
    return process.exit(1);
  }
}

main();
