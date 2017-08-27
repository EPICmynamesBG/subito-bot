'use strict';

const should = require('should');
const request = require('supertest');
const moment = require('moment');
const server = require('../../../app');
const sinon = require('sinon');
const testHelper = require('../../helper/testHelper');

const soupCalendarService = require('../../../api/services/soupCalendarService');

describe('soupCalendarController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('GET /subito/day', () => {
    it('should get todays soup', (done) => {
      const expectedSoups = [
        'Great-Grandma Hoffman’s Beef Ribley (df)',
        'Local Corn Maque Choux'
      ];

      request(server)
        .get('/subito/day')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text',
            `Here are the soups for _today_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', moment().format('YYYY-MM-DD'));
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should say none found if no soups for today', (done) => {
      sinon.stub(soupCalendarService, 'getSoupsForDay').yields(null, null);
      request(server)
        .get('/subito/day')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Soups for today not found');
          soupCalendarService.getSoupsForDay.restore();
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarService, 'getSoupsForDay').yields(new Error('500'), null);
      request(server)
        .get('/subito/day')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'An unexpected server error occured');
          soupCalendarService.getSoupsForDay.restore();
          done();
        });
    });
  });

  describe('GET /subito/day/{day}', () => {
    it('should handle string date: today', (done) => {
      const expectedSoups = [
        'Great-Grandma Hoffman’s Beef Ribley (df)',
        'Local Corn Maque Choux'
      ];

      request(server)
        .get('/subito/day/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text',
            `Here are the soups for _today_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', moment().format('YYYY-MM-DD'));
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should handle string date: tomorrow', (done) => {
      const expectedSoups = [
        'Local Corn Maque Choux',
        "SunKing's Smoked Gouda"
      ];

      request(server)
        .get('/subito/day/tomorrow')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text',
            `Here are the soups for _tomorrow_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', moment().add(1, 'd').format('YYYY-MM-DD'));
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should handle string date: yesterday', (done) => {
      const expectedSoups = [
        'Great-Grandma Hoffman’s Beef Ribley (df)',
        'Seafood Chowder (p)'
      ];

      request(server)
        .get('/subito/day/yesterday')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text',
            `Here are the soups for _yesterday_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', moment().subtract(1, 'd').format('YYYY-MM-DD'));
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should handle string date: 2017-07-31', (done) => {
      const expectedSoups = [
        'Chicken, Bacon, Local Corn Chowder (gf)',
        'Italian Wedding (df)'
      ];

      request(server)
        .get('/subito/day/2017-07-31')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          let dayStr = moment('2017-07-31').format('dddd, MMM D');
          res.body.should.have.property('text',
            `Here are the soups for _${dayStr}_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', '2017-07-31');
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should default to today if unparsable date', (done) => {
      const expectedSoups = [
        'Great-Grandma Hoffman’s Beef Ribley (df)',
        'Local Corn Maque Choux'
      ];

      request(server)
        .get('/subito/day/hello')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text',
            `Here are the soups for _today_: \n>${expectedSoups[0]}\n>${expectedSoups[1]}`);
          res.body.should.have.property('day', moment().format('YYYY-MM-DD'));
          res.body.should.have.property('soups', expectedSoups);
          res.body.should.have.property('soupsStr', `${expectedSoups[0]} and ${expectedSoups[1]}`);
          done();
        });
    });

    it('should say none found if no soups for today', (done) => {
      sinon.stub(soupCalendarService, 'getSoupsForDay').yields(null, null);
      request(server)
        .get('/subito/day/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Soups for today not found');
          soupCalendarService.getSoupsForDay.restore();
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarService, 'getSoupsForDay').yields(new Error('500'), null);
      request(server)
        .get('/subito/day/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'An unexpected server error occured');
          soupCalendarService.getSoupsForDay.restore();
          done();
        });
    });
  });
});
