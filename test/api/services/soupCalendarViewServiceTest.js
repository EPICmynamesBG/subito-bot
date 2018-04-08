'use strict';

const assert = require('assert');
const should = require('should');
const moment = require('moment');
const testHelper = require('../../helper/testHelper');
const utils = require('../../../api/helpers/utils');
const soupCalendarViewService = require('../../../api/services/soupCalendarViewService');

describe('soupCalendarViewService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('getAllSoups', () => {
    it('should get all soup calendar entries', (done) => {
      soupCalendarViewService.getAllSoups(testHelper.db, (err, soupsCals) => {
        should.not.exist(err);
        assert(soupsCals.length > 0, 'there should be soups');
        /* eslint-disable max-nested-callbacks */
        soupsCals.forEach((soupCal) => {
          soupCal.should.have.property('text');
          soupCal.should.have.property('soups');
          soupCal.should.have.property('soupsStr');
          soupCal.should.have.property('day');
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });
  });

  describe('getSoupsForDay', () => {
    it('should get soup calendar entry for day', (done) => {
      const day = 'today';
      const date = utils.dateForText(day);
      soupCalendarViewService.getSoupsForDay(testHelper.db, date, (err, soupCal) => {
        should.not.exist(err);
        soupCal.should.have.property('text');
        assert(soupCal.text.includes(day), `text should have "${day}" in it`);
        soupCal.should.have.property('soups');
        soupCal.should.have.property('soupsStr');
        soupCal.should.have.property('day', moment(date).format('YYYY-MM-DD'));
        done();
      });
    });

    it('should not find a soup', (done) => {
      const day = '12/12/1995';
      const date = utils.dateForText(day);
      soupCalendarViewService.getSoupsForDay(testHelper.db, date, (err, soupCal) => {
        should.not.exist(err);
        assert.equal(soupCal, null);
        done();
      });
    });
  });

  describe('getSoupsForWeek', () => {
    it('should get soup calendar entires for the week', (done) => {
      const day = 'today';
      const date = utils.dateForText(day);
      soupCalendarViewService.getSoupsForWeek(testHelper.db, date, (err, soups) => {
        should.not.exist(err);
        soups.should.have.property('text');
        soups.should.have.property('soups');
        soups.should.have.property('start');
        soups.should.have.property('end');
        done();
      });
    });

    it('should not find any soups', (done) => {
      const day = '12/12/1995';
      const date = utils.dateForText(day);
      soupCalendarViewService.getSoupsForWeek(testHelper.db, date, (err, soups) => {
        should.not.exist(err);
        soups.should.have.property('text');
        soups.should.have.property('soups', []);
        soups.should.have.property('start');
        soups.should.have.property('end');
        done();
      });
    });
  });
});
