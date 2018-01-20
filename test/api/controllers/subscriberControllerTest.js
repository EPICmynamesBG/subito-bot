'use strict';

const should = require('should');
const request = require('supertest');
const server = require('../../../app');
const testHelper = require('../../helper/testHelper');

const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);

  const testUser = {
    slackUserId: '123456789',
    slackUsername: 'test_user',
    slackTeamId: 'ABCDEF123'
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
          res.body.should.have.property('slackTeamId', 'ABCDEF123');
          res.body.should.have.property('text', "You're subscribed! :tada:");
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

  describe('PUT /subito/subscription', (done) => {
    request(server)
      .put('/subito/subscription')
      .type('form')
      .send({
        slackUserId: testUser.slackUserId,
        notificationTime: '8:00'
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.body.should.have.property('text', '1 subscribers UPDATED');
        done();
      });
  });
});
