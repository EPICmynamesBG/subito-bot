'use strict';

const assert = require('assert');
const should = require('should');
const request = require('supertest');
const moment = require('moment');
const server = require('../../../app');
const sinon = require('sinon');
const config = require('../../../config/config');
const testHelper = require('../../helper/testHelper');
const async = require('async');

describe('slackController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);

  describe('POST /subito/slack', () => {
    const url = '/subito/slack';
    it('should 400 on invalid params', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({})
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid token', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: 'invalid',
          text: '',
          user_id: '',
          user_name: ''
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403)
        .end((err, res) => {
          assert.equal(res.body.text, 'Invalid Slack token');
          done();
        });
    });

    it('should 200 on valid token', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: config.SLACK_SLASH_TOKEN,
          text: '',
          user_id: '',
          user_name: ''
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should forward to /subito/day', (done) => {
      async.parallel([
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: config.SLACK_SLASH_TOKEN,
              text: '',
              user_id: '123ABC',
              user_name: 'bobthebuilder'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text, 'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
              cb();
            });
        },
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: config.SLACK_SLASH_TOKEN,
              text: 'today',
              user_id: '123ABC',
              user_name: 'bobthebuilder'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text, 'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
              cb();
            });
        },
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: config.SLACK_SLASH_TOKEN,
              text: '2017-07-31',
              user_id: '123ABC',
              user_name: 'bobthebuilder'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text, 'Here are the soups for _Monday, Jul 31_: \n>Chicken, Bacon, Local Corn Chowder (gf)\n>Italian Wedding (df)');
              cb();
            });
        },
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: config.SLACK_SLASH_TOKEN,
              text: 'day 2017-07-31',
              user_id: '123ABC',
              user_name: 'bobthebuilder'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text, 'Here are the soups for _Monday, Jul 31_: \n>Chicken, Bacon, Local Corn Chowder (gf)\n>Italian Wedding (df)');
              cb();
            });
        }
      ], () => {
        done();
      });
    });

    it('should forward "search" to /subito/search', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: config.SLACK_SLASH_TOKEN,
          text: 'search corn',
          user_id: 'ABC123',
          user_name: 'testuser'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text');
          assert(res.body.soups.length > 0, 'should have soups');
          done();
        });
    });

    it('should forward "subscribe" to /subito/subscribe', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: config.SLACK_SLASH_TOKEN,
          text: 'subscribe',
          user_id: 'ABC123',
          user_name: 'testuser'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.slackUserId, 'ABC123');
          assert.equal(res.body.slackUsername, 'testuser');
          assert.equal(res.body.text, 'You\'re subscribed! :tada:');
          done();
        });
    });

    it('should forward "unsubscribe" to /subito/unsubscribe', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: config.SLACK_SLASH_TOKEN,
          text: 'unsubscribe',
          user_id: 'ABC123',
          user_name: 'testuser'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'You\'ve been unsubscribed :disappointed:');
          done();
        });
    });

    it('should 200 and return a usage description when given an unknown command', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: config.SLACK_SLASH_TOKEN,
          text: 'hello world',
          user_id: 'ABC123',
          user_name: 'testuser'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert(res.body.text.includes("Whoops, I don't recognize that command. Try one of these instead!"));
          done();
        });
    });
  });
});
