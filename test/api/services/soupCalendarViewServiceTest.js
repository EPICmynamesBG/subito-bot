'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const request = require('request');
const moment = require('moment');
const async = require('async');
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
        soupsCals.forEach((soupCal) => {
          soupCal.should.have.property('text');
          soupCal.should.have.property('soups');
          soupCal.should.have.property('soupsStr');
          soupCal.should.have.property('day');
        });
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

  describe('massUpdate', () => {
    it('should get soup calendar entry for day', (done) => {
      const updates = [];
      const soupOptions = ['Chicken Noodle', 'Beef Stew',
        'Turkey Bean Soup', 'Black Bean (gf)', 'Italian Wedding (gf)',
        'Local Corn Chowder'];
      let generateDays = lodash.random(1, 20);
      const expectedUpdateCount = generateDays * 2;
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

      soupCalendarViewService.massUpdate(testHelper.db, updates, (err, updated) => {
        should.not.exist(err);
        updated.should.have.property('rows', updates.length * 2);
        updated.should.have.property('startDate', expectedStartDate.format('YYYY/MM/DD'));
        updated.should.have.property('endDate', expectedEndDate.format('YYYY/MM/DD'));
        done();
      });
    });
  });
});
