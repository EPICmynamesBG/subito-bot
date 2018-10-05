'use strict';

const should = require('should');
const async = require('async');
const testHelper = require('../../helper/testHelper');
const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('addSubscriber', () => {
    beforeEach(testHelper.resetData);
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
        subscriber.should.have.property('search_term', null);
        subscriber.should.have.property('text', "You're subscribed! :tada:");
        done();
      });
    });

    it('should create a subscriber with a search term', (done) => {
      const user = {
        slackUserId: 'ABCXYZ123',
        slackUsername: 'bobby',
        slackTeamId: 'ABCDEF123',
        searchTerm: 'corn'
      };
      subscriberService.addSubscriber(testHelper.db, user, (err, subscriber) => {
        should.not.exist(err);
        subscriber.should.have.property('id');
        subscriber.should.have.property('slack_user_id', user.slackUserId);
        subscriber.should.have.property('slack_username', user.slackUsername);
        subscriber.should.have.property('search_term', user.searchTerm);
        subscriber.should.have.property('text', `You're subscribed to _${user.searchTerm}_! :tada:`);
        done();
      });
    });

    it('should respond user already subscribed', (done) => {
      const user = {
        slackUserId: 'ABCXYZ123',
        slackUsername: 'bobby',
        slackTeamId: 'ABCDEF123'
      };
      async.autoInject({
        before: (cb) => {
          subscriberService.addSubscriber(testHelper.db, user, cb);
        },
        subscriber: (before, cb) => {
          subscriberService.addSubscriber(testHelper.db, user, cb);
        }
      }, (err, res) => {
        should.not.exist(err);
        res.subscriber.should.have.property('text', "You're already subscribed :+1:");
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

  describe('getAdmins', () => {
    it('should return all subscribers on a slack team', (done) => {
      subscriberService.getAdmins(testHelper.db, (err, admins) => {
        should.not.exist(err);
        assert.strictEqual(admins.length, 1, 'should 1 admin');
        /* eslint-disable max-nested-callbacks */
        admins.forEach((subscriber) => {
          subscriber.should.have.property('is_admin', 1); // 1 = true
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
        slack_team_id: 'ABCDEF123',
        search_term: null,
        notify_time: '10:00:00',
        is_admin: 1
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
        slack_team_id: 'ABCDEF123',
        search_term: null,
        notify_time: '10:00:00',
        is_admin: 1
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
        slack_team_id: 'ABCDEF123',
        search_term: null,
        notify_time: '10:00:00',
        is_admin: 1
      };
      subscriberService.getSubscriberBySlackUsername(testHelper.db, expected.slack_username, expected.slack_team_id,
        (err, subscriber) => {
          should.not.exist(err);
          assert.deepEqual(subscriber, expected);
          done();
        });
    });
  });

  describe('updateSubscriberBySlackUserId', () => {
    beforeEach(testHelper.resetData);
    it('should update a subscriber', (done) => {
      const slackUserId = 'ABC_123';
      const updateObj = { notify_time: '08:00:00' };

      async.autoInject({
        update: cb => subscriberService.updateSubscriberBySlackUserId(testHelper.db, slackUserId, updateObj, cb),
        updatedRow: (update, cb) => subscriberService.getSubscriberBySlackUserId(testHelper.db, slackUserId, cb)
      }, (err, { update, updatedRow }) => {
        should.not.exist(err);
        assert.strictEqual(update.changedRows, 1);

        assert.strictEqual(updatedRow.slack_user_id, slackUserId);
        assert.strictEqual(updatedRow.notify_time, updateObj.notify_time);
        done();
      });
    });

    it('should not allow is_admin to be updated', (done) => {
      const slackUserId = 'ABC_123';
      async.autoInject({
        preUpdate: cb => subscriberService.getSubscriberBySlackUserId(testHelper.db, slackUserId, cb),
        update: (preUpdate, cb) => {
          const update = { notify_time: '08:00:00', is_admin: !preUpdate.isAdmin };
          subscriberService.updateSubscriberBySlackUserId(testHelper.db, slackUserId, update, cb)
        },
        updatedRow: (update, cb) => subscriberService.getSubscriberBySlackUserId(testHelper.db, slackUserId, cb)
      }, (err, { preUpdate, update, updatedRow }) => {
        should.not.exist(err);
        assert.strictEqual(update.changedRows, 1);

        const expected = Object.assign({}, preUpdate, { notify_time: '08:00:00' });
        assert.deepStrictEqual(updatedRow, expected);
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
        slack_team_id: 'ABCDEF123',
        search_term: null,
        notify_time: '10:00:00',
        is_admin: 1
      };
      subscriberService.deleteSubscriberById(testHelper.db, subscriber.id, (err, subscriber) => {
        should.not.exist(err);
        assert.equal(subscriber.text, '1 subscribers DELETED');
        done();
      });
    });
  });
});
