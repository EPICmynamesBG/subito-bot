'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const lodash = require('lodash');
const request = require('request');
const moment = require('moment');
const async = require('async');
const testHelper = require('../../helper/testHelper');
const utils = require('../../../api/helpers/utils');
const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('addSubscriber', () => {
    it('should return the created subscriber', (done) => {
      const user = {
        slackUserId: 'ABCXYZ123',
        slackUsername: 'bobby'
      };
      subscriberService.addSubscriber(testHelper.db, user, (err, subscriber) => {
        should.not.exist(err);
        subscriber.should.have.property('id');
        subscriber.should.have.property('slack_user_id', user.slackUserId);
        subscriber.should.have.property('slack_username', user.slackUsername);
        subscriber.should.have.property('text', "You're subscribed! :tada:");
        done();
      });
    });

    it('should respond user already subscribed', (done) => {
      const user = {
        slackUserId: 'ABCXYZ123',
        slackUsername: 'bobby'
      };
      subscriberService.addSubscriber(testHelper.db, user, (err, subscriber) => {
        should.not.exist(err);
        subscriber.should.have.property('text', "You're already subscribed :+1:");
        done();
      });
    });
  });

  describe('getSubscribers', () => {
    it('should return all subscribers', (done) => {
      subscriberService.getSubscribers(testHelper.db, (err, subscribers) => {
        should.not.exist(err);
        assert(subscribers.length > 0, 'should have subscribers');
        subscribers.forEach((subscriber) => {
          subscriber.should.have.property('id');
          subscriber.should.have.property('slack_user_id');
          subscriber.should.have.property('slack_username');
        });
        done();
      });
    });
  });

  describe('getSubscriberById', () => {
    it('should get a subscriber by id', (done) => {
      const expected = {
        id: 1001,
        slack_user_id: 'ABC_123',
        slack_username: 'benjamin'
      };
      subscriberService.getSubscriberById(testHelper.db, expected.id, (err, subscriber) => {
        should.not.exist(err);
        assert.deepEqual(subscriber, expected);
        done();
      });
    });
  });

  describe('getSubscriberBySlackUserId', () => {
    it('should get a subscriber by slack user id', (done) => {
      const expected = {
        id: 1001,
        slack_user_id: 'ABC_123',
        slack_username: 'benjamin'
      };
      subscriberService.getSubscriberBySlackUserId(testHelper.db, expected.slack_user_id, (err, subscriber) => {
        should.not.exist(err);
        assert.deepEqual(subscriber, expected);
        done();
      });
    });
  });

  describe('getSubscriberBySlackUsername', () => {
    it('should get a subscriber by slack user name', (done) => {
      const expected = {
        id: 1001,
        slack_user_id: 'ABC_123',
        slack_username: 'benjamin'
      };
      subscriberService.getSubscriberBySlackUsername(testHelper.db, expected.slack_username, (err, subscriber) => {
        should.not.exist(err);
        assert.deepEqual(subscriber, expected);
        done();
      });
    });
  });

  describe('deleteSubscriberById', () => {
    it('should delete a subscriber by id', (done) => {
      const subscriber = {
        id: 1001,
        slack_user_id: 'ABC_123',
        slack_username: 'benjamin'
      };
      subscriberService.deleteSubscriberById(testHelper.db, subscriber.id, (err, subscriber) => {
        should.not.exist(err);
        assert.equal(subscriber.text, '1 subscribers DELETED');
        done();
      });
    });
  });
});
