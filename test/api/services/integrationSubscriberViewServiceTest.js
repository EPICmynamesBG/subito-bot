'use strict';

const should = require('should');

const testHelper = require('../../helper/testHelper');
const integrationSubscriberViewService = require('../../../api/services/integrationSubscriberViewService');

describe('integrationSubscriberViewService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('getAll', () => {
    it('should get all integration subscriber entries', (done) => {
      integrationSubscriberViewService.getAll(testHelper.db, (err, entries) => {
        should.not.exist(err);
        assert(entries.length > 0, 'there should be entries');
        /* eslint-disable max-nested-callbacks */
        entries.forEach((entry) => {
          entry.should.have.property('id');
          entry.should.have.property('slack_user_id');
          entry.should.have.property('slack_username');
          entry.should.have.property('slack_team_id');
          entry.should.have.property('slack_team_domain');
          entry.should.have.property('slack_slash_token');
          assert.notEqual(entry.slack_slash_token, 'helloworld');
          entry.should.have.property('slack_webhook_url');
          entry.should.have.property('search_term');
          entry.should.have.property('notify_time');
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should get all integration subscriber entries with encrypted fields decrypted', (done) => {
      integrationSubscriberViewService.getAll(testHelper.db, true, (err, entries) => {
        should.not.exist(err);
        assert(entries.length > 0, 'there should be entries');
        /* eslint-disable max-nested-callbacks */
        entries.forEach((entry) => {
          entry.should.have.property('id');
          entry.should.have.property('slack_user_id');
          entry.should.have.property('slack_username');
          entry.should.have.property('slack_team_id');
          entry.should.have.property('slack_team_domain');
          entry.should.have.property('slack_slash_token');
          assert.equal(entry.slack_slash_token, 'helloworld');
          entry.should.have.property('slack_webhook_url');
          entry.should.have.property('search_term');
          entry.should.have.property('notify_time');
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });
  });
});
