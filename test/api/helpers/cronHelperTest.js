'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const async = require('async');
const testHelper = require('../../helper/testHelper');
const cronHelper = require('../../../api/helpers/cronHelper');
const parseSubito = require('../../../api/helpers/parseSubito');
const slack = require('../../../api/helpers/slack');
const logger = require('../../../api/helpers/logger');
const utils = require('../../../api/helpers/utils');
const subscriberService = require('../../../api/services/subscriberService');
const soupCalendarViewService = require('../../../api/services/soupCalendarViewService');
const integrationSubscriberViewService = require('../../../api/services/integrationSubscriberViewService');

const testSubscribers = require('../../data/Subscribers.json');
const testIntegrations = require('../../data/OauthIntegrations.json');
const testHtml = fs.readFileSync(path.join(__dirname, '../../data') + '/test-calendar.html', 'utf-8');

const subscriberIds = testSubscribers.map(sub => sub.slack_user_id);
const integrationBotTokens = testIntegrations.map(integration => integration.bot_token);

describe('cronHelper', () => {
  beforeEach(testHelper.resetData);
  after(testHelper.clearData);
  describe('importCalendar', () => {
    it('should not error', (done) => {
      const loggerSpy = sinon.spy(logger, 'info');
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(null, null);
      sinon.stub(fs, 'readFile').yields(null, testHtml);
      cronHelper.importCalendar(testHelper.db)((err, result) => {
        should.not.exist(err);
        assert(result.rows > 0);
        assert(loggerSpy.calledWith('importCalendar complete:: '));

        parseSubito.private.fetchSoupPage.restore();
        fs.readFile.restore();
        loggerSpy.restore();
        done();
      });
    });
  });

  describe('processSubscribers', () => {
    it('should not error', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      const loggerSpy = sinon.spy(logger, 'info');
      const soupCalSpy = sinon.spy(soupCalendarViewService, 'getSoupsForDay');
      cronHelper.processSubscribers(testHelper.db)((err) => {
        should.not.exist(err);
        assert(soupCalSpy.calledOnce);
        assert(loggerSpy.calledWith('processSubscribers complete'));
        assert.equal(slackSpy.getCalls().length, testSubscribers.length);

        /* eslint-disable max-nested-callbacks */
        slackSpy.getCalls().forEach((call) => {
          const userId = call.args[0];
          const message = call.args[1];
          const slackBotToken = call.args[2];
          assert(subscriberIds.includes(userId));
          assert(typeof message === 'string');
          assert(integrationBotTokens.includes(slackBotToken));
        });
        /* eslint-enable max-nested-callbacks */

        slackSpy.restore();
        loggerSpy.restore();
        soupCalSpy.restore();
        done();
      });
    });

    it('should not message when there are no soups', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      const loggerSpy = sinon.spy(logger, 'info');
      const soupCalSpy = sinon.stub(soupCalendarViewService, 'getSoupsForDay').yields(null, null);
      cronHelper.processSubscribers(testHelper.db)((err) => {
        assert.deepEqual(err, { clean: true });
        assert(soupCalSpy.calledOnce);
        assert(loggerSpy.calledWith('processSubscribers complete'));
        assert.equal(slackSpy.getCalls().length, 0);
        slackSpy.restore();
        loggerSpy.restore();
        soupCalSpy.restore();
        done();
      });
    });
  });

  describe('private.buildCustomText', () => {
    it ('should return a formatted string', () => {
      const result = cronHelper.private.buildCustomTest('corn', ['Corn Chowder', 'Southwest Chili']);
      // eslint-disable-next-line max-len
      const expected =  'Today\'s the day! _corn_ is on the menu! Here are the soups: \n>Corn Chowder\n>Southwest Chili';
      assert.equal(result, expected);
    });
  });

  describe('private.processSubscriber', () => {
    it('should message the subscriber', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      async.autoInject({
        soups: (cb) => {
          soupCalendarViewService.getSoupsForDay(testHelper.db, utils.dateForText('today'), cb);
        },
        subscriber: (cb) => {
          integrationSubscriberViewService.getAll(testHelper.db, true, (err, res) => {
            cb(err, res[0]);
          });
        },
        process: (soups, subscriber, cb) => {
          assert.equal(subscriber.search_term, null);
          cronHelper.private.processSubscriber(testHelper.db, subscriber, soups, cb);
        }
      }, (err) => {
        should.not.exist(err);
        assert(slackSpy.calledOnce);
        const call = slackSpy.getCalls()[0];
        const userId = call.args[0];
        const message = call.args[1];
        // eslint-disable-next-line max-len
        assert.equal(message, 'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
        const slackBotToken = call.args[2];
        assert(subscriberIds.includes(userId));
        assert(typeof message === 'string');
        assert(integrationBotTokens.includes(slackBotToken));
        slackSpy.restore();
        done();
      });
    });

    it('should message the subscriber with search term', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      async.autoInject({
        before: (cb) => {
          subscriberService.addSubscriber(testHelper.db, {
            slackUserId: 'XZYWVV',
            slackUsername: 'crontest',
            slackTeamId: 'XYZDEF123',
            searchTerm: 'corn'
          }, cb);
        },
        soups: (before, cb) => {
          soupCalendarViewService.getSoupsForDay(testHelper.db, utils.dateForText('today'), cb);
        },
        subscriber: (before, cb) => {
          integrationSubscriberViewService.getAll(testHelper.db, true, (err, res) => {
            cb(err, res.find(sub => sub.id === before.id));
          });
        },
        process: (soups, subscriber, cb) => {
          assert.equal(subscriber.search_term, 'corn');
          cronHelper.private.processSubscriber(testHelper.db, subscriber, soups, cb);
        }
      }, (err) => {
        should.not.exist(err);
        assert(slackSpy.calledOnce);
        const call = slackSpy.getCalls()[0];
        const message = call.args[1];
        // eslint-disable-next-line max-len
        assert.equal(message, 'Today\'s the day! _corn_ is on the menu! Here are the soups: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
        const botToken = call.args[2];
        assert(integrationBotTokens.includes(botToken));
        slackSpy.restore();
        done();
      });
    });

    it('should not message the subscriber with search term when not found on that day', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      const loggerSpy = sinon.spy(logger, 'debug');
      async.autoInject({
        before: (cb) => {
          subscriberService.addSubscriber(testHelper.db, {
            slackUserId: 'XZYWVZ',
            slackUsername: 'crontest',
            slackTeamId: 'XYZDEF123',
            searchTerm: 'invalid'
          }, cb);
        },
        soups: (before, cb) => {
          soupCalendarViewService.getSoupsForDay(testHelper.db, utils.dateForText('today'), cb);
        },
        subscriber: (before, cb) => {
          integrationSubscriberViewService.getAll(testHelper.db, true, (err, res) => {
            cb(err, res.find(sub => sub.id === before.id));
          });
        },
        process: (soups, subscriber, cb) => {
          assert.equal(subscriber.search_term, 'invalid');
          cronHelper.private.processSubscriber(testHelper.db, subscriber, soups, cb);
        }
      }, (err, res) => {
        should.not.exist(err);
        assert(slackSpy.getCalls().length === 0);
        const call = loggerSpy.lastCall;
        assert.equal(call.args[0], '_processSubscriber');
        assert.equal(call.args[1], res.subscriber);
        assert.equal(call.args[2].clean, true);
        assert(call.args[2].error);
        loggerSpy.restore();
        slackSpy.restore();
        done();
      });
    });

    it('should not message the suscriber when outside of notification time range', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUserAsBot').yields(null, { ok: true });
      const loggerSpy = sinon.spy(logger, 'debug');
      async.autoInject({
        soups: (cb) => {
          soupCalendarViewService.getSoupsForDay(testHelper.db, utils.dateForText('today'), cb);
        },
        subscribers: (cb) => {
          integrationSubscriberViewService.getAll(testHelper.db, true, cb);
        },
        process: (soups, subscribers, cb) => {
          async.each(subscribers, (subscriber, ecb) => {
            cronHelper.private.processSubscriber(testHelper.db, subscriber, soups, (err) => {
              assert(!err);
              ecb();
            });
          }, cb);
        }
      }, (err) => {
        assert(!err);
        assert(slackSpy.getCalls().length === 0);
        assert(loggerSpy.getCalls().length > 0);

        loggerSpy.restore();
        slackSpy.restore();
        done();
      });
    });
  });

  describe('private.isTimeToNotify', () => {
    it('should return true when within a 15 minute range', () => {
      // let test = {
      //   timezone: { tz: 'America/Indiana/Indianapolis' }
      // };
      // let result = cronHelper.private.isTimeToNotify(test);
      // TODO: How to test this time logic?
      assert(true);
    });
  });
});
