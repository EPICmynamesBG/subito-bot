'use strict';

const should = require('should');

const testHelper = require('../../helper/testHelper');
const soupCalendarService = require('../../../api/services/soupCalendarService');

describe('soupCalendarService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('searchForSoup', () => {
    it('should search for a string', (done) => {
      const searchStr = 'corn';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(Array.isArray(res));
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should ignore case', (done) => {
      const searchStr = 'CORN';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr.toLowerCase()));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should order by next soonest', (done) => {
      const searchStr = 'corn';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        let last = null;
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          if (last === null) {
            last = result;
          } else {
            assert(moment(last.day).isBefore(moment(result.day), 'd') ||
                  moment(last.day).isSame(moment(result.day), 'd'),
            `${result.day} is not equal or before ${last.day}`);
            last = result;
          }
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should only return results for today and later', (done) => {
      const searchStr = 'corn';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(moment(result.day).isAfter(moment(), 'd') ||
                  moment(result.day).isSame(moment(), 'd'), `${result.day} is not equal or after today`);
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should trim spaces', (done) => {
      const searchStr = ' corn ';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr.trim()));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should return empty array on null searchStr', (done) => {
      const searchStr = null;
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert.equal(res.length, 0, 'should not have results');
        done();
      });
    });
  });

  describe('searchForSoupOnDay', () => {
    it('should search for a string', (done) => {
      const searchStr = 'corn';
      soupCalendarService.searchForSoupOnDay(testHelper.db, searchStr, moment().toDate(), (err, res) => {
        assert.equal(err, null);
        assert(Array.isArray(res));
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should ignore case', (done) => {
      const searchStr = 'CORN';
      soupCalendarService.searchForSoupOnDay(testHelper.db, searchStr, moment().toDate(), (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr.toLowerCase()));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should only return results for the given day', (done) => {
      const searchStr = 'corn';
      soupCalendarService.searchForSoupOnDay(testHelper.db, searchStr, moment().toDate(), (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(moment(result.day).isAfter(moment(), 'd') ||
                  moment(result.day).isSame(moment(), 'd'), `${result.day} is not equal or after today`);
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should trim spaces', (done) => {
      const searchStr = ' corn ';
      soupCalendarService.searchForSoupOnDay(testHelper.db, searchStr, moment().toDate(), (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        /* eslint-disable max-nested-callbacks */
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr.trim()));
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should return empty array on null searchStr', (done) => {
      const searchStr = null;
      soupCalendarService.searchForSoupOnDay(testHelper.db, searchStr, moment().toDate(), (err, res) => {
        assert.equal(err, null);
        assert.equal(res.length, 0, 'should not have results');
        done();
      });
    });
  });

  describe('massUpdate', () => {
    it('should get soup calendar entry for day', (done) => {
      const updates = [];
      const soupOptions = ['Chicken Noodle', 'Beef Stew',
        'Turkey Bean Soup', 'Black Bean (gf)', 'Italian Wedding (gf)',
        'Local Corn Chowder'];
      let generateDays = lodash.random(1, 20);
      let expectedStartDate;
      let expectedEndDate;
      for (var i = 0; i < generateDays; i++) {
        const soups = lodash.clone(soupOptions).splice(lodash.random(0, soupOptions.length - 2), 2);
        const date = moment().add(lodash.random(-10, 10), 'd');

        if (!expectedStartDate) expectedStartDate = date;
        else if (date < expectedStartDate) expectedStartDate = date;
        if (!expectedEndDate) expectedEndDate = date;
        else if (date > expectedEndDate) expectedEndDate = date;

        updates.push({
          date: date.format(),
          soups: soups
        });
      }

      soupCalendarService.massUpdate(testHelper.db, updates, null, (err, updated) => {
        should.not.exist(err);
        updated.should.have.property('rows', updates.length * 2);
        updated.should.have.property('startDate', expectedStartDate.format('YYYY/MM/DD'));
        updated.should.have.property('endDate', expectedEndDate.format('YYYY/MM/DD'));
        done();
      });
    });
  });
});
