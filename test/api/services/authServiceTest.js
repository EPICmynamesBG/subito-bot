'use strict';

const async = require('async');
const assert = require('assert');
const lodash = require('lodash');
const sinon = require('sinon');
const request = require('request');
const testHelper = require('../../helper/testHelper');
const authService = require('../../../api/services/authService');

describe('authService', () => {
  before(testHelper.resetData);
//  after(testHelper.clearData);
  
  const insertData = {
    team_id: 'ABCDEF',
    team_name: 'Test1',
    token: 'access_token',
    bot_token: 'bot_token',
    scope: 'read',
    installer_user_id: 'ABC123123',
    domain: null,
    webhook_url: 'some_url',
    webhook_channel: '@slackbot',
    webhook_config_url: 'some_url'
  };

  describe('validateTeamToken', () => {
    it('should validate a token + team id pair', (done) => {
      const teamId = 'ABCDEF123';
      const rawToken = 'helloworld';
      authService.validateTeamToken(testHelper.db, teamId, rawToken, (valid) => {
        assert.equal(valid, true);
        done();
      });
    });

    it('should fail', (done) => {
      const teamId = 'ABCDEF123';
      const rawToken = 'bad token';
      authService.validateTeamToken(testHelper.db, teamId, rawToken, (valid) => {
        assert.equal(valid, false);
        done();
      });
    });
  });

  describe('createOauthIntegration', () => {
    it('should create an oauth integration', (done) => {
      const clone = lodash.clone(insertData);
      clone.team_id = clone.team_id.concat(lodash.random(0, 999).toString());
      authService.createOauthIntegration(testHelper.db, clone, (err, res) => {
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
      authService.createOauthIntegration(testHelper.db, clone, (err) => {
        if (err) throw err;
        done();
      });
    });
    
    it('should get an oauth integration', (done) => {
      authService.getOauthIntegrationById(testHelper.db, sample.team_id, (err, res) =>{
        assert.equal(err, null);
        assert.equal(res.team_id, sample.team_id);
        assert.equal(res.token, sample.token);
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
        }
      };
      sinon.stub(request, 'post').yields(null, { statusCode: 200 }, JSON.stringify(test));
      sinon.spy(authService, 'createOauthIntegration');

      async.autoInject({
        run: (cb) => {
          authService.processOAuth(testHelper.db, { code: 'some_code' }, cb);
        },
        integration: (run, cb) => {
          authService.getOauthIntegrationById(testHelper.db, test.team_id, cb);
        }
      }, (err, res) => {
        assert.equal(err, null);
        const integration = res.integration;
        assert.equal(integration.bot_token, test.bot.bot_access_token);
        assert.equal(integration.token, test.access_token);
        assert(request.post.calledOnce);
        assert(authService.createOauthIntegration.calledOnce);
        authService.createOauthIntegration.restore();
        request.post.restore();
        done();
      });
    });
  });
});
