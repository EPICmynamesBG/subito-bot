'use strict';

const should = require('should');
const request = require('supertest');
const errors = require('common-errors');
const moment = require('moment');
const server = require('../../../app');
const sinon = require('sinon');
const testHelper = require('../../helper/testHelper');

const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  
  const testUser = {
    slackUserId: '123456789',
    slackUsername: 'test_user'
  };
  describe('POST /subito/subscribe', () => {
    it('should add a subscriber', (done) => {
      request(server)
        .post('/subito/subscribe')
        .type('form')
        .send(testUser)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('slackUserId', '123456789');
          res.body.should.have.property('slackUsername', 'test_user');
          res.body.should.have.property('text', "You're subscribed!");
          done();
        });
    });

    it('should note "already subscribed"', (done) => {
      request(server)
        .post('/subito/subscribe')
        .type('form')
        .send(testUser)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text', "You're already subscribed :+1:");
          done();
        });
    });
  });

  describe('POST /subito/unsubscribe', () => {
    before((done) => {
      subscriberService.addSubscriber(testHelper.db, testUser, (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should unsubscribe the user', (done) => {
      request(server)
        .post('/subito/unsubscribe')
        .type('form')
        .send(testUser)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text', '1 subscribers DELETED');
          done();
        });
    });
  });

  describe('DELETE /subito/unsubscribe', () => {
    before((done) => {
      subscriberService.addSubscriber(testHelper.db, testUser, (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should unsubscribe the user', (done) => {
      request(server)
        .delete('/subito/unsubscribe')
        .type('form')
        .send(testUser)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text', '1 subscribers DELETED');
          done();
        });
    });
  });
});
