'use strict';

const async = require('async');
const assert = require('assert');
const lodash = require('lodash');
const sinon = require('sinon');
const request = require('request');
const SlackNode = require('slack-node');
const testHelper = require('../../helper/testHelper');
const oauthService = require('../../../api/services/oauthService');

describe('oauthService', () => {
  before(testHelper.resetData);
  afterEach(testHelper.clearData);

  const insertData = {
    team_id: 'ABCDEF',
    team_name: 'Test1',
    token: 'access_token',
    bot_token: 'bot_token',
    scope: 'read',
    installer_user_id: 'ABC123123',
    domain: 'null',
    webhook_url: 'some_url',
    webhook_channel: '@slackbot',
    webhook_config_url: 'some_url'
  };

  describe('createOauthIntegration', () => {
    it('should create an oauth integration', (done) => {
      const clone = lodash.clone(insertData);
      clone.team_id = clone.team_id.concat(lodash.random(0, 999).toString());
      oauthService.createOauthIntegration(testHelper.db, clone, (err, res) => {
        assert.equal(err, null);
        assert.notEqual(res, null);
        done();
      });
    });
  });

  describe('getOauthIntegrationById', () => {
    let sample;
    before((done) => {
      const clone = lodash.clone(insertData);
      clone.team_id = clone.team_id.concat(lodash.random(0, 999).toString());
      sample = clone;
      oauthService.createOauthIntegration(testHelper.db, clone, (err) => {
        if (err) throw err;
        done();
      });
    });

    it('should get an oauth integration', (done) => {
      oauthService.getOauthIntegrationById(testHelper.db, sample.team_id, (err, res) =>{
        assert.equal(err, null);
        assert.equal(res.team_id, sample.team_id);
        assert.equal(res.token, sample.token);
        done();
      });
    });
  });

  describe('updateOauthIntegration', () => {
    let sample;
    before((done) => {
      const clone = lodash.clone(insertData);
      clone.team_id = clone.team_id.concat(lodash.random(0, 999).toString());
      sample = clone;
      oauthService.createOauthIntegration(testHelper.db, clone, (err) => {
        if (err) throw err;
        done();
      });
    });

    it('should update an oauth integration', (done) => {
      oauthService.updateOauthIntegration(testHelper.db, sample.team_id, { bot_token: 'new token' }, (err, res) =>{
        assert.equal(err, null);
        assert.equal(res.affectedRows, 1);
        done();
      });
    });
  });

  describe('processOAuth', () => {
    it('should process correctly', (done) => {
      const test = {
        access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX',
        scope: 'incoming-webhook,commands,bot',
        team_name: 'Teamk',
        team_id: 'XXXXXXXXX',
        user_id: 'ABC123567',
        bot: {
          bot_access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX'
        },
        incoming_webhook: {
          url: 'https://hooks.slack.com/TXXXXX/BXXXXX/XXXXXXXXXX',
          channel: '#channel-it-will-post-to',
          configuration_url: 'https://teamname.slack.com/services/BXXXXX'
        },
        ok: true
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 200 }, JSON.stringify(test));
      sinon.spy(oauthService, 'createOauthIntegration');
      sinon.stub(SlackNode.prototype, 'api').yields(null, { team: {  domain: 'test.com' } });

      async.autoInject({
        run: (cb) => {
          oauthService.processOAuth(testHelper.db, { code: 'some_code' }, cb);
        },
        integration: (run, cb) => {
          oauthService.getOauthIntegrationById(testHelper.db, test.team_id, cb);
        }
      }, (err, res) => {
        assert.equal(err, null);
        const integration = res.integration;
        assert.equal(integration.bot_token, test.bot.bot_access_token);
        assert.equal(integration.token, test.access_token);
        assert(request.post.calledOnce);
        assert(oauthService.createOauthIntegration.calledOnce);
        oauthService.createOauthIntegration.restore();
        SlackNode.prototype.api.restore();
        request.post.restore();
        done();
      });
    });

    it('should request error on code', (done) => {
      const test = {
        error_message: 'Server Error',
        ok: false
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 500 }, JSON.stringify(test));

      oauthService.processOAuth(testHelper.db, { code: 'some_code' }, (err) => {
        assert(err);
        assert.equal(err.statusCode, 500);
        assert(request.post.calledOnce);
        request.post.restore();
        done();
      });
    });

    it('should slack error on code', (done) => {
      const test = {
        error_message: 'Some random error',
        ok: false
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 200 }, JSON.stringify(test));

      oauthService.processOAuth(testHelper.db, { code: 'some_code' }, (err) => {
        assert(err);
        assert.equal(err.statusCode, 400);
        assert(request.post.calledOnce);
        request.post.restore();
        done();
      });
    });

    it('should succeed when team pull errors', (done) => {
      const test = {
        access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX',
        scope: 'incoming-webhook,commands,bot',
        team_name: 'Teamk',
        team_id: 'XXXXXXXXX',
        user_id: 'ABC123567',
        bot: {
          bot_access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX'
        },
        incoming_webhook: {
          url: 'https://hooks.slack.com/TXXXXX/BXXXXX/XXXXXXXXXX',
          channel: '#channel-it-will-post-to',
          configuration_url: 'https://teamname.slack.com/services/BXXXXX'
        },
        ok: true
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 200 }, JSON.stringify(test));
      sinon.stub(SlackNode.prototype, 'api').yields(new Error('Some Error'));

      async.autoInject({
        run: (cb) => {
          oauthService.processOAuth(testHelper.db, { code: 'some_code' }, cb);
        },
        integration: (run, cb) => {
          oauthService.getOauthIntegrationById(testHelper.db, test.team_id, cb);
        }
      }, (err, res) => {
        assert.equal(err, null);
        const integration = res.integration;
        assert.equal(integration.domain, null);

        SlackNode.prototype.api.restore();
        request.post.restore();
        done();
      });
    });

    it('should succeed when team pull errors via slack', (done) => {
      const test = {
        access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX',
        scope: 'incoming-webhook,commands,bot',
        team_name: 'Teamk',
        team_id: 'XXXXXXXXX',
        user_id: 'ABC123567',
        bot: {
          bot_access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX'
        },
        incoming_webhook: {
          url: 'https://hooks.slack.com/TXXXXX/BXXXXX/XXXXXXXXXX',
          channel: '#channel-it-will-post-to',
          configuration_url: 'https://teamname.slack.com/services/BXXXXX'
        },
        ok: true
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 200 }, JSON.stringify(test));
      sinon.stub(SlackNode.prototype, 'api').yields(null, { ok: false, error_message: 'Not Allowed' });

      async.autoInject({
        run: (cb) => {
          oauthService.processOAuth(testHelper.db, { code: 'some_code' }, cb);
        },
        integration: (run, cb) => {
          oauthService.getOauthIntegrationById(testHelper.db, test.team_id, cb);
        }
      }, (err, res) => {
        assert.equal(err, null);
        const integration = res.integration;
        assert.equal(integration.domain, null);

        SlackNode.prototype.api.restore();
        request.post.restore();
        done();
      });
    });
  });
});
