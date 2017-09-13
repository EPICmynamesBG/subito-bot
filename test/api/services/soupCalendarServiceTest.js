'use strict';

const assert = require('assert');
const should = require('should');
const moment = require('moment');

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
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr));
        });
        done();
      });
    });

    it('should ignore case', (done) => {
      const searchStr = 'CORN';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        res.forEach((result) => {
          assert(result.soup.toLowerCase().includes(searchStr.toLowerCase()));
        });
        done();
      });
    });

    it('should order by next soonest', (done) => {
      const searchStr = 'CORN';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 1, 'should have results');
        let last = null;
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
        done();
      });
    });

    it('should only return results for today and later', (done) => {
      const searchStr = 'CORN';
      soupCalendarService.searchForSoup(testHelper.db, searchStr, (err, res) => {
        assert.equal(err, null);
        assert(res.length > 0, 'should have results');
        res.forEach((result) => {
          assert(moment(result.day).isAfter(moment(), 'd') ||
                  moment(result.day).isSame(moment(), 'd'), `${result.day} is not equal or after today`);
        });
        done();
      });
    });
  });
});
