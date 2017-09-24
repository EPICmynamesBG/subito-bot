'use strict';

const async = require('async');
const lodash = require('lodash');
const logger = require('./logger');
const utils = require('./utils');

const QUERY_TYPE = {
  SELECT: 'SELECT',
  SELECT_ONE: 'SELECT ONE',
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

// eslint-disable-next-line complexity
function _queryBuilder(table, queryType, valuesParam, whereParams = {}) {
  /* eslint-disable no-param-reassign */
  if (!valuesParam && queryType !== QUERY_TYPE.UPDATE) valuesParam = [];
  else if (!valuesParam && queryType === QUERY_TYPE.UPDATE) valuesParam = {};
  if (!whereParams) whereParams = {};
  /* eslint-enable no-param-reassign */

  let query;
  switch (queryType) {
  case QUERY_TYPE.INSERT:
    query = `INSERT INTO \`${table}\``;
    break;
  case QUERY_TYPE.UPDATE:
    query = `UPDATE \`${table}\``;
    break;
  case QUERY_TYPE.DELETE:
    query = `DELETE FROM \`${table}\``;
    break;
  default:
    query = `SELECT * FROM \`${table}\``;
  }

  let values = [];
  const where = [];
  const whereKeys = Object.keys(whereParams);
  let valuesKeys = [];
  if (queryType === QUERY_TYPE.UPDATE) {
    valuesKeys = Object.keys(valuesParam);
  } else if (valuesParam.length > 0) {
    valuesKeys = Object.keys(valuesParam[0]);
  }

  if (valuesKeys.length > 0) {
    if (queryType === QUERY_TYPE.INSERT) {
      query = query.concat(' (');
      valuesKeys.forEach((key) => {
        query = query.concat(`\`${key}\`, `);
      })
      query = query.slice(0, -2);
      query = query.concat(') VALUES ?');
    } else if (queryType === QUERY_TYPE.UPDATE) {
      query = query.concat(' SET ');
      valuesKeys.forEach((key) => {
        query = query.concat(`\`${key}\` = ?, `);
      });
      query = query.slice(0, -2);
    }
    if (queryType === QUERY_TYPE.UPDATE) {
      valuesKeys.forEach((key, index) => {
        values[index] = valuesParam[key];
      });
    } else {
      values = valuesParam.map((entry) => {
        let temp = new Array(valuesKeys.length);
        valuesKeys.forEach((key, index) => {
          temp[index] = entry[key];
        });
        return temp;
      });
    }
  }
  if (whereKeys.length > 0) {
    query = query.concat(' WHERE ');
    whereKeys.forEach((key) => {
      query = query.concat(`\`${key}\` = ? AND `);
      where.push(whereParams[key]);
    });
    query = query.slice(0, -5);
  }

  return {
    table: table,
    query: query.trim(),
    queryType: queryType,
    values: values,
    where: where
  };
}

function _resultsHandler(err, results, callback, context = 'No context provided') {
  if (err) {
    logger.error(err, context);
    callback(err);
    return;
  }
  if (!results || results.length === 0) {
    logger.info('No results', context);
    callback(null, null);
    return;
  }
  if (context && context.queryType === QUERY_TYPE.SELECT_ONE) {
    if (results.length > 1) {
      logger.warn('More than 1 result found with Select One query', context);
      callback(new Error('Multiple results found when expecting one'));
      return;
    }
    callback(null, lodash.toPlainObject(results[0]))
    return;
  } else if (context && (context.queryType === QUERY_TYPE.INSERT ||
                        context.queryType === QUERY_TYPE.UPDATE ||
                        context.queryType === QUERY_TYPE.DELETE)) {
    const pastTenseAction = context.queryType.slice(-1) === 'E' ?
      context.queryType.concat('D') :
      context.queryType.concat('ED');
    const response = {
      text: `${results.affectedRows} ${utils.pluralize(context.table)} ${pastTenseAction}`
    };
    callback(null, Object.assign(response, results));
    return;
  }
  if (Array.isArray(results)) {
    callback(null, results.map(lodash.toPlainObject));
    return;
  }
  callback(null, lodash.toPlainObject(results));
}

function _query(db, build, callback) {
  let paramArr = [];
  if (build.values.length > 0 && build.queryType !== QUERY_TYPE.UPDATE) {
    paramArr = [build.values];
  } else if (build.queryType === QUERY_TYPE.UPDATE) {
    paramArr = build.values;
  }
  paramArr = paramArr.concat(build.where);
  db.query(build.query, paramArr, (e, res) => {
    module.exports.private.resultsHandler(e, res, callback, build);
  });
}

function select(db, table, whereParams, callback) {
  if (typeof whereParams === 'function') {
    /* eslint-disable no-param-reassign */
    callback = whereParams;
    whereParams = {};
    /* eslint-enable no-param-reassign */
  }
  const build = module.exports.private.queryBuilder(table, QUERY_TYPE.SELECT, [], whereParams);
  module.exports.private.query(db, build, callback);
}

function selectOne(db, table, whereParams, callback) {
  if (typeof whereParams === 'function') {
    /* eslint-disable no-param-reassign */
    callback = whereParams;
    whereParams = {};
    /* eslint-enable no-param-reassign */
  }
  const build = module.exports.private.queryBuilder(table, QUERY_TYPE.SELECT_ONE, [], whereParams);
  module.exports.private.query(db, build, callback);
}

function insert(db, table, values, callback) {
  if (typeof values === 'object' && !Array.isArray(values)) {
    /* eslint-disable no-param-reassign */
    values = [values];
    /* eslint-enable no-param-reassign */
  }
  const build = module.exports.private.queryBuilder(table, QUERY_TYPE.INSERT, values, {});
  module.exports.private.query(db, build, callback);
}

function update(db, table, values, whereParams, callback) {
  /* eslint-disable no-param-reassign */
  if (typeof whereParams === 'function') {
    callback = whereParams;
    whereParams = {};
  }
  /* eslint-enable no-param-reassign */
  const build = module.exports.private.queryBuilder(table, QUERY_TYPE.UPDATE, values, whereParams);
  module.exports.private.query(db, build, callback);
}

function deleteAction(db, table, whereParams, callback) {
  if (typeof whereParams === 'function') {
    /* eslint-disable no-param-reassign */
    callback = whereParams;
    whereParams = {};
    /* eslint-enable no-param-reassign */
  }
  const build = module.exports.private.queryBuilder(table, QUERY_TYPE.DELETE, [], whereParams);
  module.exports.private.query(db, build, callback);
}

function deleteOne(db, table, whereParams, callback) {
  async.waterfall([
    (cb) => {
      module.exports.selectOne(db, table, whereParams, cb);
    },
    (selected, cb) => {
      // selectOne will throw error if not just one found
      const build = module.exports.private.queryBuilder(table, QUERY_TYPE.DELETE, [], whereParams);
      module.exports.private.query(db, build, cb);
    }
  ], callback);
}

function custom(db, query, paramArr, callback) {
  db.query(query, paramArr, (e, res) => {
    module.exports.private.resultsHandler(e, res, callback,
      { query: query, customParams: paramArr, queryType: 'CUSTOM' });
  });
}

module.exports = {
  create: insert,
  select: select,
  selectOne: selectOne,
  read: select,
  insert: insert,
  update: update,
  delete: deleteAction,
  deleteOne: deleteOne,
  custom: custom,
  private: {
    queryBuilder: _queryBuilder,
    QUERY_TYPE: QUERY_TYPE,
    query: _query,
    resultsHandler: _resultsHandler
  }
}
