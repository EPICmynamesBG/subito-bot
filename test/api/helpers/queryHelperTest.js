'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const moment = require('moment');

const testHelper = require('../../helper/testHelper');
const logger = require('../../../api/helpers/logger');
const queryHelper = require('../../../api/helpers/queryHelper');

let queryBuilderSpy, querySpy, resultsHandlerSpy;

describe('queryHelper', () => {
  before(testHelper.resetData);
  afterEach(() => {
    queryBuilderSpy ? queryBuilderSpy.restore() : null;
    querySpy? querySpy.restore() : null;
    resultsHandlerSpy ? resultsHandlerSpy.restore() : null;
  });
  after(testHelper.clearData);
  describe('select', () => {
    it('should perform a basic select', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');

      queryHelper.select(testHelper.db, 'soup_calendar_view', (err, res) => {
        should.not.exist(err);
        should.exist(res);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar_view', queryHelper.private.QUERY_TYPE.SELECT, [], {}));
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar_view',
          query: 'SELECT * FROM `soup_calendar_view`',
          queryType: queryHelper.private.QUERY_TYPE.SELECT,
          values: [],
          where: []
        });
        assert(Array.isArray(res));
        done();
      });
    });

    it('should perform a select with 1 where', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().format('YYYY-MM-DD');

      queryHelper.select(testHelper.db, 'soup_calendar', { day: day }, (err, res) => {
        should.not.exist(err);
        should.exist(res);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar', queryHelper.private.QUERY_TYPE.SELECT, [], { day: day }));
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'SELECT * FROM `soup_calendar` WHERE `day` = ?',
          queryType: queryHelper.private.QUERY_TYPE.SELECT,
          values: [],
          where: [day]
        });
        assert(Array.isArray(res));
        done();
      });
    });

    it('should perform a select with 2 where', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().format('YYYY-MM-DD');
      const soup = 'Local Corn Maque Choux';

      queryHelper.select(testHelper.db, 'soup_calendar', { day: day, soup: soup }, (err, res) => {
        should.not.exist(err);
        should.exist(res);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.SELECT,
          [],
          { day: day, soup: soup }));
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'SELECT * FROM `soup_calendar` WHERE `day` = ? AND `soup` = ?',
          queryType: queryHelper.private.QUERY_TYPE.SELECT,
          values: [],
          where: [day, soup]
        });
        assert(Array.isArray(res));
        done();
      });
    });

    it('should be null when successful query and no results found', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const soup = 'Some Nothing';

      queryHelper.select(testHelper.db, 'soup_calendar', { soup: soup }, (err, res) => {
        should.not.exist(err);
        assert.equal(res, null);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);
        
        done();
      });
    });
  });

  describe('selectOne', () => {
    it('should perform a basic selectOne', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().format('YYYY-MM-DD');

      queryHelper.selectOne(testHelper.db, 'soup_calendar_view', { day: day },  (err, res) => {
        should.not.exist(err);
        should.exist(res);
        assert(!Array.isArray(res), 'should not be an array');
        assert(typeof res === 'object', 'should be an object');
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar_view',
          queryHelper.private.QUERY_TYPE.SELECT_ONE,
          [],
          { day: day }));
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar_view',
          query: 'SELECT * FROM `soup_calendar_view` WHERE `day` = ?',
          queryType: queryHelper.private.QUERY_TYPE.SELECT_ONE,
          values: [],
          where: [day]
        });
        done();
      });
    });

    it('should callback with error when more than one result found', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const loggerSpy = sinon.spy(logger, 'warn');
      const day = moment().format('YYYY-MM-DD');

      queryHelper.selectOne(testHelper.db, 'soup_calendar', { day: day },  (err, res) => {
        should.exist(err);
        assert.equal(err.message, 'Multiple results found when expecting one');
        should.not.exist(res);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.SELECT_ONE,
          [],
          { day: day }));

        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'SELECT * FROM `soup_calendar` WHERE `day` = ?',
          queryType: queryHelper.private.QUERY_TYPE.SELECT_ONE,
          values: [],
          where: [day]
        });
        assert(loggerSpy.calledOnce,
          'logger.warn should be called when more then one result is found');
        loggerSpy.restore();
        done();
      });
    });
  });
});
