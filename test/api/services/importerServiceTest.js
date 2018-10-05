'use strict';

const testHelper = require('../../helper/testHelper');
const importerService = require('../../../api/services/importerService');
const logger = require('../../../api/helpers/logger');
const slack = require('../../../api/helpers/slack');
const soupCalendarService = require('../../../api/services/soupCalendarService');
const subscriberService = require('../../../api/services/subscriberService');

describe('importerService', () => {
  describe('performDateValidation', () => {
    let sandbox;
    const startDate = moment().subtract(3, 'days').format();
    const endDate = moment().add(3, 'days').format();
    const range = [startDate, endDate];
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });
    afterEach(() => sandbox.restore());

    it('should SafeError when no soups returned from validateSoupsForRange', (done) => {
      sandbox.stub(soupCalendarService, 'validateSoupsForRange').yields(undefined, []);
      sandbox.spy(subscriberService, 'getAdmins');
      sandbox.stub(slack, 'messageUserAsBot').yields();

      importerService.performDateValidation(testHelper.db, range, (err) => {
        assert.equal(err.name, 'SafeError');
        assert(subscriberService.getAdmins.notCalled);
        assert(slack.messageUserAsBot.notCalled);
        done();
      });
    });

    it('should logger.warn when soups returned', (done) => {
      sandbox.stub(soupCalendarService, 'validateSoupsForRange')
        .yields(undefined, [{ day: moment().format(), soup_count: 3 }]);
      sandbox.stub(subscriberService, 'getAdmins').yields(undefined, []);
      sandbox.stub(slack, 'messageUserAsBot').yields();
      sandbox.spy(logger, 'warn');

      importerService.performDateValidation(testHelper.db, range, (err) => {
        if (err) throw err;
        assert(subscriberService.getAdmins.calledOnce);
        assert(slack.messageUserAsBot.notCalled);
        assert(logger.warn.calledOnce);
        done();
      });
    });

    it('should properly format messgae', (done) => {
      const day = moment().format();
      sandbox.stub(soupCalendarService, 'validateSoupsForRange')
        .yields(undefined, [{ day: day, soup_count: 3 }]);
      sandbox.stub(subscriberService, 'getAdmins').yields(undefined, []);
      sandbox.stub(slack, 'messageUserAsBot').yields();
      sandbox.spy(logger, 'warn');

      const expected =
        `*Warning*: The following dates do not have 2 soup records:\n> ${moment(day).format('dddd, MMM D')} - 3`;

      importerService.performDateValidation(testHelper.db, range, (err) => {
        if (err) throw err;
        const output = logger.warn.firstCall.args[0];
        assert.strictEqual(output, expected);
        done();
      });
    });

    it('should message admins when soups are returned', (done) => {
      sandbox.stub(soupCalendarService, 'validateSoupsForRange')
        .yields(undefined, [{ day: moment().format(), soup_count: 3 }]);
      sandbox.stub(subscriberService, 'getAdmins').yields(undefined,
        [testHelper.testSubscriber, testHelper.testSubscriber]);
      sandbox.stub(slack, 'messageUserAsBot').yields();

      importerService.performDateValidation(testHelper.db, range, (err) => {
        if (err) throw err;
        assert(subscriberService.getAdmins.calledOnce);
        assert(slack.messageUserAsBot.calledTwice);
        done();
      });
    });

    it('should not error when messaging an admin errors', (done) => {
      sandbox.stub(soupCalendarService, 'validateSoupsForRange')
        .yields(undefined, [{ day: moment().format(), soup_count: 3 }]);
      sandbox.stub(subscriberService, 'getAdmins').yields(undefined,
        [testHelper.testSubscriber, testHelper.testSubscriber]);
      sandbox.stub(slack, 'messageUserAsBot')
        .onFirstCall().yields(new Error('FAUX'))
        .onSecondCall().yields();

      importerService.performDateValidation(testHelper.db, range, (err) => {
        if (err) throw err;
        assert(subscriberService.getAdmins.calledOnce);
        assert(slack.messageUserAsBot.calledTwice);
        done();
      });
    });
  });
});
