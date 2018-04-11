'use strict';

const async = require('async');
const errors = require('common-errors');
const should = require('should');

const testHelper = require('../../helper/testHelper');
const oauthService = require('../../../api/services/oauthService');
const slack = require('../../../api/helpers/slack');

const { SLACK_VERIFICATION_TOKEN } = require('../../../config/config');

const validAuth = {
  team_id: 'ABCDEF123',
  token: SLACK_VERIFICATION_TOKEN
};

describe('slackController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);

  describe('POST /subito/slack', () => {
    const url = '/subito/slack';
    it('should 400 on invalid params', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({})
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid token', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: 'invalid',
          text: '',
          user_id: '',
          user_name: ''
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'Invalid Slack token');
          done();
        });
    });

    it('should 200 on valid token', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: '',
          user_id: '',
          user_name: '',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should forward to /subito/day', (done) => {
      async.parallel([
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: validAuth.token,
              text: '',
              user_id: '123ABC',
              user_name: 'bobthebuilder',
              team_id: validAuth.team_id
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text,
                'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
              cb();
            });
        },
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: validAuth.token,
              text: 'today',
              user_id: '123ABC',
              user_name: 'bobthebuilder',
              team_id: validAuth.team_id
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text,
                'Here are the soups for _today_: \n>Great-Grandma Hoffman’s Beef Ribley (df)\n>Local Corn Maque Choux');
              cb();
            });
        },
        (cb) => {
          request(server)
            .post(url)
            .type('form')
            .send({
              token: validAuth.token,
              text: '2017-07-31',
              user_id: '123ABC',
              user_name: 'bobthebuilder',
              team_id: validAuth.team_id
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              assert.equal(res.body.text, // eslint-disable-next-line max-len
                'Here are the soups for _Monday, Jul 31_: \n>Chicken, Bacon, Local Corn Chowder (gf)\n>Italian Wedding (df)');
              cb();
            });
        }
      ], () => {
        done();
      });
    });

    it('should forward "search" to /subito/search', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'search corn',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text');
          assert(res.body.soups.length > 0, 'should have soups');
          done();
        });
    });

    it('should forward "subscribe" to /subito/subscribe', (done) => {
      sinon.stub(slack, 'fetchUserInfo').yields(null, {
        tz: 'America/New_York'
      });
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'subscribe',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.slackUserId, 'ABC123');
          assert.equal(res.body.slackUsername, 'testuser');
          assert.equal(res.body.text, 'You\'re subscribed! :tada:');
          slack.fetchUserInfo.restore();
          done();
        });
    });

    it('should forward "subscribe" to /subito/subscribe with search string', (done) => {
      sinon.stub(slack, 'fetchUserInfo').yields(null, {
        tz: 'America/New_York'
      });
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'subscribe corn',
          user_id: 'ABCD123',
          user_name: 'testuser2',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.slackUserId, 'ABCD123');
          assert.equal(res.body.slackUsername, 'testuser2');
          assert.equal(res.body.text, 'You\'re subscribed to _corn_! :tada:');
          slack.fetchUserInfo.restore();
          done();
        });
    });

    it('should forward "unsubscribe" to /subito/unsubscribe', (done) => {
      sinon.stub(slack, 'fetchUserInfo').yields(null, {
        tz: 'America/New_York'
      });
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'unsubscribe',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'You\'ve been unsubscribed :disappointed:');
          slack.fetchUserInfo.restore();
          done();
        });
    });

    it('should forward "week" to /subito/week', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'week',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text');
          done();
        });
    });

    it('should 200 and return text for "feedback"', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'feedback',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert(res.body.text.includes("Submit"));
          done();
        });
    });

    it('should 200 and return text for "settings"', (done) => {
      sinon.stub(slack, 'fetchUserInfo').yields(null, {
        tz: 'America/New_York'
      });
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'settings notify 8:00',
          user_id: 'ABC_123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'Your subscription notification time has been updated to 8:00');
          slack.fetchUserInfo.restore();
          done();
        });
    });

    it('should 200 and return a usage description when given an unknown command', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          token: validAuth.token,
          text: 'hello world',
          user_id: 'ABC123',
          user_name: 'testuser',
          team_id: validAuth.team_id
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert(res.body.text.includes("Whoops, I don't recognize that command. Try one of these instead!"));
          done();
        });
    });
  });

  describe('/slack/oauth', () => {
    const url = '/subito/slack/oauth';
    it('should succeed', (done) => {
      sinon.stub(oauthService, 'processOAuth').yields(null, { team: { domain: 'test' }});
      request(server)
        .get(url.concat('?code=test'))
        .redirects(1)
        .end(() => {
          oauthService.processOAuth.restore();
          done();
        });
    });

    it('should succeed, but without redirect', (done) => {
      sinon.stub(oauthService, 'processOAuth').yields(null, { team: null });
      request(server)
        .get(url.concat('?code=test'))
        .expect(200)
        .expect('Content-Type', /json/)
        .redirects(0)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'Subito-Suboto registered!');
          oauthService.processOAuth.restore();
          done();
        });
    });

    it('should error', (done) => {
      sinon.stub(oauthService, 'processOAuth').yields(new errors.HttpStatusError(400, 'Slack error'));
      request(server)
        .get(url.concat('?code=test'))
        .expect(400)
        .expect('Content-Type', /json/)
        .redirects(0)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'Slack error');
          oauthService.processOAuth.restore();
          done();
        });
    });

    it('should handle error query param', (done) => {
      request(server)
        .get(url.concat('?error=test_error'))
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          should.not.exist(err);
          assert.equal(res.body.text, 'Slack Error: test_error');
          done();
        });
    });
  })
});
