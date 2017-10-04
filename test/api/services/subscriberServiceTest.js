'use strict';

const assert = require('assert');
const should = require('should');
const testHelper = require('../../helper/testHelper');
const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('addSubscriber', () => {
    it('should return the created subscriber', (done) => {
      const user = {
        slackUserId: 'ABCXYZ123',
        slackUsername: 'bobby',
        slackTeamId: 'ABCDEF123'
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
        slackUsername: 'bobby',
        slackTeamId: 'ABCDEF123'
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
        /* eslint-disable max-nested-callbacks */
        subscribers.forEach((subscriber) => {
          subscriber.should.have.property('id');
          subscriber.should.have.property('slack_user_id');
          subscriber.should.have.property('slack_username');
          subscriber.should.have.property('slack_team_id');
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });
  });

  describe('getSubscribersForTeam', () => {
    const testId = 'ABCDEF123';
    it('should return all subscribers on a slack team', (done) => {
      subscriberService.getSubscribersForTeam(testHelper.db, testId, (err, subscribers) => {
        should.not.exist(err);
        assert(subscribers.length > 0, 'should have subscribers');
        /* eslint-disable max-nested-callbacks */
        subscribers.forEach((subscriber) => {
          subscriber.should.have.property('slack_team_id', testId);
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });
  });

  describe('getSubscriberById', () => {
    it('should get a subscriber by id', (done) => {
      const expected = {
        id: 1001,
        slack_user_id: 'ABC_123',
        slack_username: 'benjamin',
        slack_team_id: 'ABCDEF123'
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
        slack_username: 'benjamin',
        slack_team_id: 'ABCDEF123'
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
        slack_username: 'benjamin',
        slack_team_id: 'ABCDEF123'
      };
      subscriberService.getSubscriberBySlackUsername(testHelper.db, expected.slack_username, expected.slack_team_id,
        (err, subscriber) => {
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
        slack_username: 'benjamin',
        slack_team_id: 'ABCDEF123'
      };
      subscriberService.deleteSubscriberById(testHelper.db, subscriber.id, (err, subscriber) => {
        should.not.exist(err);
        assert.equal(subscriber.text, '1 subscribers DELETED');
        done();
      });
    });
  });
});
