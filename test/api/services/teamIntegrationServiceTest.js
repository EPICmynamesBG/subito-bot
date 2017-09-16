'use strict';

const async = require('async');
const assert = require('assert');
const should = require('should');
const testHelper = require('../../helper/testHelper');
const teamIntegrationService = require('../../../api/services/teamIntegrationService');
const subscriberService = require('../../../api/services/subscriberService');

describe('subscriberService', () => {
  beforeEach(testHelper.resetData);
  after(testHelper.clearData);
  describe('addIntegration', () => {
    it('should succeed', (done) => {
      const integration = {
        teamId: 'ABC123XYZ',
        teamDomain: 'testdomain2',
        slashToken: 'Some Token',
        webhookUrl: 'Some URL'
      };

      teamIntegrationService.addIntegration(testHelper.db, integration, (err, res) => {
        should.not.exist(err);
        assert.equal(res.affectedRows, 1);
        done();
      });
    });

    it('should encrypt certain fields', (done) => {
      const integration = {
        teamId: 'ABC123XYZ',
        teamDomain: 'testdomain2',
        slashToken: 'Some Token',
        webhookUrl: 'Some URL',
        metadata: { a: 'test' }
      };

      async.waterfall([
        (cb) => {
          teamIntegrationService.addIntegration(testHelper.db, integration, cb);
        },
        (created, cb) => {
          teamIntegrationService.getIntegrationById(testHelper.db, integration.teamId, cb);
        }
      ], (err, thisIntegration) => {
        should.not.exist(err);
        assert.equal(integration.teamId, thisIntegration.team_id);
        assert.notEqual(integration.slashToken, thisIntegration.slack_slash_token);
        assert.notEqual(integration.webhookUrl, thisIntegration.slack_webhook_url);
        assert.notEqual(integration.metadata, thisIntegration.metadata);
        done();
      });
    });

    it('should error with duplicate team_id ', (done) => {
      const integration = {
        teamId: 'ABC123XYZ',
        teamDomain: 'testdomain2',
        slashToken: 'Some Token',
        webhookUrl: 'Some URL'
      };

      async.waterfall([
        (cb) => {
          teamIntegrationService.addIntegration(testHelper.db, integration, cb);
        },
        (res, cb) => {
          teamIntegrationService.addIntegration(testHelper.db, integration, cb);
        }
      ], (err) => {
        should.exist(err);
        assert.equal(err.code, 'ER_DUP_ENTRY');
        done();
      })
    });
  });

  describe('getAllIntegrations', () => {
    it('should return all integrations', (done) => {
      teamIntegrationService.getAllIntegrations(testHelper.db, (err, integrations) => {
        should.not.exist(err);
        assert(integrations.length > 0, 'should have integrations');
        /* eslint-disable max-nested-callbacks */
        integrations.forEach((integration) => {
          integration.should.have.property('team_id');
          integration.should.have.property('team_domain');
          integration.should.have.property('slack_slash_token');
          integration.should.have.property('slack_webhook_url');
          integration.should.have.property('metadata');
        });
        /* eslint-enable max-nested-callbacks */
        done();
      });
    });

    it('should have an option to decrypt encrypted fields', (done) => {
      async.autoInject({
        decrypted: (cb) => {
          teamIntegrationService.getAllIntegrations(testHelper.db, true, cb);
        },
        encrypted: (cb) => {
          teamIntegrationService.getAllIntegrations(testHelper.db, cb);
        }
      }, (err, results) => {
        should.not.exist(err);
        assert(results.decrypted.length > 0, 'should have integrations');
        assert(results.encrypted.length > 0, 'should have integrations');
        assert(results.decrypted.length === results.encrypted.length);
        results.decrypted.forEach((decryptedRow, index) => {
          const encryptedRow = results.encrypted[index];
          assert.equal(decryptedRow.team_id, encryptedRow.team_id);
          assert.equal(decryptedRow.team_domain, encryptedRow.team_domain);
          assert.notEqual(decryptedRow.slack_slash_token, encryptedRow.slack_slash_token);
          assert.notEqual(decryptedRow.slack_webhook_url, encryptedRow.slack_webhook_url);
          if (decryptedRow.metadata !== null) {
            assert.notEqual(decryptedRow.metadata, encryptedRow.metadata);
          }
        });
        done();
      });
    });
  });

  describe('getIntegrationById', () => {
    it('should get an integration by id', (done) => {
      const testId = 'ABCDEF123';
      teamIntegrationService.getIntegrationById(testHelper.db, testId, (err, res) => {
        should.not.exist(err);
        assert.equal(res.team_id, testId);
        done();
      });
    });

    it('should optionally allow decrypting fields', (done) => {
      const testId = 'XYZDEF123';
      async.autoInject({
        decrypted: (cb) => {
          teamIntegrationService.getIntegrationById(testHelper.db, testId, true, cb);
        },
        encrypted: (cb) => {
          teamIntegrationService.getIntegrationById(testHelper.db, testId, cb);
        }
      }, (err, results) => {
        should.not.exist(err);
        const decrypted = results.decrypted;
        const encrypted = results.encrypted;
        assert.equal(decrypted.team_id, encrypted.team_id);
        assert.equal(decrypted.team_domain, encrypted.team_domain);
        assert.notEqual(decrypted.slack_slash_token, encrypted.slack_slash_token);
        assert.notEqual(decrypted.slack_webhook_url, encrypted.slack_webhook_url);
        if (decrypted.metadata !== null) {
          assert.notEqual(decrypted.metadata, encrypted.metadata);
        }
        done();
      });
    });
  });

  describe('updateIntegration', () => {
    it('should update an integration by team id', (done) => {
      const testId = 'ABCDEF123';
      const updateObj = {
        metadata: 'hello world'
      };
      teamIntegrationService.updateIntegration(testHelper.db, testId, updateObj, (err, updated) => {
        should.not.exist(err);
        assert.equal(updated.affectedRows, 1);
        done();
      });
    });

    it('should allow updating the team id', (done) => {
      const testId = 'ABCDEF123';
      const updateObj = {
        teamId: 'ABCDEF124'
      };
      teamIntegrationService.updateIntegration(testHelper.db, testId, updateObj, (err, updated) => {
        should.not.exist(err);
        assert.equal(updated.affectedRows, 1);
        done();
      });
    });
  });

  describe('removeIntegration', () => {
    it('should delete an integration by team id', (done) => {
      const testId = 'ABCDEF123';
      teamIntegrationService.removeIntegration(testHelper.db, testId, (err, deleted) => {
        should.not.exist(err);
        assert.equal(deleted.affectedRows, 1);
        done();
      });
    });

    it('should CASCADE delete all connected subscribers for a team', (done) => {
      const testId = 'ABCDEF123';

      async.waterfall([
        (cb) => {
          subscriberService.getSubscribersForTeam(testHelper.db, testId, cb);
        },
        (subscribers, cb) => {
          assert(subscribers.length > 0, 'should be subscribers');
          teamIntegrationService.removeIntegration(testHelper.db, testId, cb);
        },
        (deleted, cb) => {
          subscriberService.getSubscribersForTeam(testHelper.db, testId, cb);
        }
      ], (err, subscribers) => {
        should.not.exist(err);
        assert.equal(subscribers, null, 'should not be subscribers');
        done();
      });
    });
  });
});
