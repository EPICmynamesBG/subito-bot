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
const testIntegrations = require('../../data/TeamIntegrations.json');
const testHtml = fs.readFileSync(path.join(__dirname, '../../data') + '/test-calendar.html', 'utf-8');

const subscriberNames = testSubscribers.map(sub => sub.slack_username);
const integrationWebhooks = testIntegrations.map(integration => integration.slack_webhook_url);

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
      const slackSpy = sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
      const loggerSpy = sinon.spy(logger, 'info');
      const soupCalSpy = sinon.spy(soupCalendarViewService, 'getSoupsForDay');
      cronHelper.processSubscribers(testHelper.db)((err) => {
        should.not.exist(err);
        assert(soupCalSpy.calledOnce);
        assert(loggerSpy.calledWith('processSubscribers complete'));
        assert.equal(slackSpy.getCalls().length, testSubscribers.length);
        
        /* eslint-disable max-nested-callbacks */
        slackSpy.getCalls().forEach((call) => {
          const name = call.args[0];
          const message = call.args[1];
          const webhookUrl = call.args[2];
          assert(subscriberNames.includes(name));
          assert(typeof message === 'string');
          assert(integrationWebhooks.includes(webhookUrl));
        });
        /* eslint-enable max-nested-callbacks */

        slackSpy.restore();
        loggerSpy.restore();
        soupCalSpy.restore();
        done();
      });
    });

    it('should not message when there are no soups', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
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
      const slackSpy = sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
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
        const name = call.args[0];
        const message = call.args[1];
        // eslint-disable-next-line max-len
        assert.equal(message, 'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
        const webhookUrl = call.args[2];
        assert(subscriberNames.includes(name));
        assert(typeof message === 'string');
        assert(integrationWebhooks.includes(webhookUrl));
        slackSpy.restore();
        done();
      });
    });

    it('should message the subscriber with search term', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
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
        const webhookUrl = call.args[2];
        assert(integrationWebhooks.includes(webhookUrl));
        slackSpy.restore();
        done();
      });
    });

    it('should not message the subscriber with search term when not found on that day', (done) => {
      const slackSpy = sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
      const loggerSpy = sinon.spy(logger, 'error');
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
        assert(loggerSpy.calledOnce);
        const call = loggerSpy.getCalls()[0];
        assert.equal(call.args[0], '_processSubscriber');
        assert.equal(call.args[1], res.subscriber);
        assert(call.args[2].message.includes('no soups for "invalid" found today'));
        loggerSpy.restore();
        slackSpy.restore();
        done();
      });
    });
  });
});
