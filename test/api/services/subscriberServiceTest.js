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

describe('soupCalendarService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('addSubscriber', () => {
    it('should return the created subscriber', (done) => {
      const user = {
        id: 'ABCXYZ12',
        username: 'bobby'
      };
      subscriberService.addSubscriber(testHelper.db, user, (err, subscriber) => {
        should.not.exist(err);
        subscriber.should.have.property('id');
        subscriber.should.have.property('slack_user_id', user.id);
        subscriber.should.have.property('slack_username', user.username);
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
});
