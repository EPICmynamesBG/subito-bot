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

  it('shouldn\'t crash on DB error', (done) => {
    sinon.stub(testHelper.db, 'query').yields('Some DB Error');
    resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');

    queryHelper.select(testHelper.db, 'soup_calendar', (err, res) => {
      assert.notEqual(err, null);
      assert.equal(res, null);
      testHelper.db.query.restore();
      done();
    });
  });

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

  describe('insert', () => {
    it('should perform a single insert', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().add(7, 'd').format('YYYY-MM-DD');
      const newSoup = {
        day: day,
        soup: 'Test Soup'
      };
      
      queryHelper.insert(testHelper.db, 'soup_calendar', newSoup, (err, res) => {
        should.not.exist(err);
        res.should.have.property('insertId');
        res.should.have.property('text', '1 soup_calendars INSERTED');
        res.should.have.property('affectedRows', 1);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.INSERT,
          [newSoup],
          {})
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'INSERT INTO `soup_calendar` (`day`, `soup`) VALUES ?',
          queryType: queryHelper.private.QUERY_TYPE.INSERT,
          values: [[newSoup.day, newSoup.soup]],
          where: []
        });
        done();
      });
    });

    it('should perform a multiple insert', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().add(8, 'd').format('YYYY-MM-DD');
      const newSoup1 = {
        day: day,
        soup: 'Test Soup 1'
      };
      const newSoup2 = {
        day: day,
        soup: 'Test Soup 2'
      };
      
      queryHelper.insert(testHelper.db, 'soup_calendar', [newSoup1, newSoup2], (err, res) => {
        should.not.exist(err);
        res.should.have.property('insertId');
        res.should.have.property('text', '2 soup_calendars INSERTED');
        res.should.have.property('affectedRows', 2);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.INSERT,
          [newSoup1, newSoup2],
          {})
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'INSERT INTO `soup_calendar` (`day`, `soup`) VALUES ?',
          queryType: queryHelper.private.QUERY_TYPE.INSERT,
          values: [[newSoup1.day, newSoup1.soup], [newSoup2.day, newSoup2.soup]],
          where: []
        });
        done();
      });
    });
  });

  describe('update', () => {
    it('should perform a single column update on one row', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const newSoup = 'Test Soup Update';
      
      queryHelper.update(testHelper.db, 'soup_calendar', { soup: newSoup }, { id: 1001 }, (err, res) => {
        should.not.exist(err);
        res.should.have.property('changedRows', 1);
        res.should.have.property('text', '1 soup_calendars UPDATED');
        res.should.have.property('affectedRows', 1);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.UPDATE,
          { soup: newSoup },
          { id: 1001 })
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'UPDATE `soup_calendar` SET `soup` = ? WHERE `id` = ?',
          queryType: queryHelper.private.QUERY_TYPE.UPDATE,
          values: [newSoup],
          where: [1001]
        });
        done();
      });
    });

    it('should perform a multi column update', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const newSoup = 'Test Soup Update';
      const day = moment().add(3, 'd').format('YYYY-MM-DD');
      
      queryHelper.update(testHelper.db, 'soup_calendar', { day: day, soup: newSoup }, { id: 1001 }, (err, res) => {
        should.not.exist(err);
        res.should.have.property('changedRows', 1);
        res.should.have.property('text', '1 soup_calendars UPDATED');
        res.should.have.property('affectedRows', 1);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.UPDATE,
          { day: day, soup: newSoup },
          { id: 1001 })
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'UPDATE `soup_calendar` SET `day` = ?, `soup` = ? WHERE `id` = ?',
          queryType: queryHelper.private.QUERY_TYPE.UPDATE,
          values: [day, newSoup],
          where: [1001]
        });
        done();
      });
    });
  });

  describe('delete', () => {
    it('should delete a row', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      
      queryHelper.delete(testHelper.db, 'soup_calendar', { id: 1001 }, (err, res) => {
        should.not.exist(err);
        res.should.have.property('text', '1 soup_calendars DELETED');
        res.should.have.property('affectedRows', 1);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.DELETE,
          [],
          { id: 1001 })
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'DELETE FROM `soup_calendar` WHERE `id` = ?',
          queryType: queryHelper.private.QUERY_TYPE.DELETE,
          values: [],
          where: [1001]
        });
        done();
      });
    });

    it('should delete multiple rows', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().add(-1, 'd').format('YYYY-MM-DD');
      
      queryHelper.delete(testHelper.db, 'soup_calendar', { day: day }, (err, res) => {
        should.not.exist(err);
        res.should.have.property('text', '2 soup_calendars DELETED');
        res.should.have.property('affectedRows', 2);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);

        assert(queryBuilderSpy.calledWith('soup_calendar',
          queryHelper.private.QUERY_TYPE.DELETE,
          [],
          { day: day })
        );
        assert.deepEqual(querySpy.args[0][1], {
          table: 'soup_calendar',
          query: 'DELETE FROM `soup_calendar` WHERE `day` = ?',
          queryType: queryHelper.private.QUERY_TYPE.DELETE,
          values: [],
          where: [day]
        });
        done();
      });
    });
  });

  describe('deleteOne', () => {
    before(testHelper.resetData);
    it('should delete a row', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      
      queryHelper.deleteOne(testHelper.db, 'soup_calendar', { id: 1003 }, (err, res) => {
        should.not.exist(err);
        res.should.have.property('text', '1 soup_calendars DELETED');
        res.should.have.property('affectedRows', 1);
        assert(queryBuilderSpy.calledTwice);
        assert(querySpy.calledTwice);
        assert(resultsHandlerSpy.calledTwice);
        done();
      });
    });

    it('should error when multiple rows will be deleted', (done) => {
      queryBuilderSpy = sinon.spy(queryHelper.private, 'queryBuilder');
      querySpy = sinon.spy(queryHelper.private, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');
      const day = moment().add(-1, 'd').format('YYYY-MM-DD');
      
      queryHelper.deleteOne(testHelper.db, 'soup_calendar', { day: day }, (err, res) => {
        should.exist(err);
        assert.equal(err.message, 'Multiple results found when expecting one');
        should.not.exist(res);
        assert(queryBuilderSpy.calledOnce);
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);
        done();
      });
    });
  });

  describe('custom', () => {
    it('should directly execute the query with params', (done) => {
      querySpy = sinon.spy(testHelper.db, 'query');
      resultsHandlerSpy = sinon.spy(queryHelper.private, 'resultsHandler');

      queryHelper.custom(testHelper.db, 'SELECT * FROM `soup_calendar` WHERE `id` = ?', [1001], (err, res) => {
        should.not.exist(err);
        assert(Array.isArray(res) || res === null, 'response should be an array or null');
        assert(querySpy.calledOnce);
        assert(resultsHandlerSpy.calledOnce);
        done();
      });
    });
  });
});
