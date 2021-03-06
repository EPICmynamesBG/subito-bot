'use strict';

const should = require('should');
const testHelper = require('../../helper/testHelper');

const soupCalendarViewService = require('../../../api/services/soupCalendarViewService');
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
      sinon.stub(soupCalendarViewService, 'getSoupsForDay').yields(null, null);
      request(server)
        .get('/subito/day')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Soups for today not found');
          soupCalendarViewService.getSoupsForDay.restore();
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarViewService, 'getSoupsForDay').yields(new Error(), null);
      request(server)
        .get('/subito/day')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Whoops, something unexpected happened...');
          soupCalendarViewService.getSoupsForDay.restore();
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
      sinon.stub(soupCalendarViewService, 'getSoupsForDay').yields(null, null);
      request(server)
        .get('/subito/day/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Soups for today not found');
          soupCalendarViewService.getSoupsForDay.restore();
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarViewService, 'getSoupsForDay').yields(new Error(), null);
      request(server)
        .get('/subito/day/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Whoops, something unexpected happened...');
          soupCalendarViewService.getSoupsForDay.restore();
          done();
        });
    });
  });

  describe('GET /subito/search', () => {
    it('should search for soups', (done) => {
      request(server)
        .get('/subito/search?search=corn')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          assert(Array.isArray(res.body), 'body should be an array');
          assert(res.body.length > 0, 'should have results');
          const soupDay = res.body[0];
          soupDay.should.have.property('day');
          soupDay.should.have.property('soup');
          done();
        });
    });

    it('should have no results when no search parameter', (done) => {
      request(server)
        .get('/subito/search')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          assert(Array.isArray(res.body), 'body should be an array');
          assert.equal(res.body.length, 0, 'should have no results');
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarService, 'searchForSoup').yields(new Error(), null);
      request(server)
        .get('/subito/search?search=corn')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Whoops, something unexpected happened...');
          soupCalendarService.searchForSoup.restore();
          done();
        });
    });
  });

  describe('GET /subito/week/{day}', () => {
    it('should default to today', (done) => {
      request(server)
        .get('/subito/week')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text');
          res.body.should.have.property('soups');
          res.body.should.have.property('start');
          res.body.should.have.property('end');
          done();
        });
    });

    it('should handle string date: today', (done) => {
      request(server)
        .get('/subito/week/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text');
          res.body.should.have.property('soups');
          res.body.should.have.property('start');
          res.body.should.have.property('end');
          done();
        });
    });

    it('should handle string date: tomorrow', (done) => {
      request(server)
        .get('/subito/week/tomorrow')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text');
          res.body.should.have.property('soups');
          res.body.should.have.property('start');
          res.body.should.have.property('end');
          done();
        });
    });

    it('should handle string date: yesterday', (done) => {
      request(server)
        .get('/subito/week/yesterday')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text');
          res.body.should.have.property('soups');
          res.body.should.have.property('start');
          res.body.should.have.property('end');
          done();
        });
    });

    it('should handle string date: 2017-07-31', (done) => {
      request(server)
        .get('/subito/week/2017-07-31')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text');
          res.body.should.have.property('soups');
          res.body.should.have.property('start');
          res.body.should.have.property('end');
          done();
        });
    });

    it('should say server error', (done) => {
      sinon.stub(soupCalendarViewService, 'getSoupsForWeek').yields(new Error(), null);
      request(server)
        .get('/subito/week/today')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.should.have.property('text', 'Whoops, something unexpected happened...');
          soupCalendarViewService.getSoupsForWeek.restore();
          done();
        });
    });
  });
});
