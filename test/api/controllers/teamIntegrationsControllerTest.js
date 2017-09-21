'use strict';

const assert = require('assert');
const should = require('should');
const request = require('supertest');
const server = require('../../../app');
const testHelper = require('../../helper/testHelper');

const validAuth = 'Bearer HelloWorld';
const invalidAuth = 'Bearer Goodbye';
const url = '/subito/integrations';

describe('slackController', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);

  describe('POST /subito/integrations', () => {
    it('should 200 on valid params', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          teamId: 'ABC123ZYX',
          teamDomain: 'testteam',
          slackSlashToken: 'ABC123999',
          slackWebhookUrl: 'https://api.slack.com/something'
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
    
    it('should 400 on invalid params', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          hello_world: null
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(400)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
    
    it('should 401 on missing auth', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          teamId: 'ABC123ZYY',
          teamDomain: 'testteam2',
          slackSlashToken: 'ABC123999',
          slackWebhookUrl: 'https://api.slack.com/something'
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid auth', (done) => {
      request(server)
        .post(url)
        .type('form')
        .send({
          teamId: 'ABC123ZYY',
          teamDomain: 'testteam2',
          slackSlashToken: 'ABC123999',
          slackWebhookUrl: 'https://api.slack.com/something'
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', invalidAuth)
        .expect(403)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('GET /subito/integrations', () => {
    it('should 200 on valid params', (done) => {
      request(server)
        .get(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          assert(Array.isArray(res.body));
          /* eslint-disable max-nested-callbacks */
          res.body.forEach((integration) => {
            integration.should.have.property('teamId');
            integration.should.have.property('teamDomain');
            integration.should.have.property('createdAt');
            integration.should.have.property('slackSlashToken');
            integration.should.have.property('slackWebhookUrl');
            integration.should.have.property('metadata');
          });
          /* eslint-enable max-nested-callbacks */
          done();
        });
    });
    
    it('should 401 on missing auth params', (done) => {
      request(server)
        .get(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid auth', (done) => {
      request(server)
        .get(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', invalidAuth)
        .expect(403)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('GET /subito/integrations/{teamId}', () => {
    it('should 200 on valid params', (done) => {
      request(server)
        .get(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          const integration = res.body;
          integration.should.have.property('teamId', 'ABCDEF123');
          integration.should.have.property('teamDomain', 'abcdomain');
          integration.should.have.property('createdAt');
          integration.should.have.property('slackSlashToken');
          assert.notEqual('slackSlashToken', 'helloworld', 'should be encrypted');
          integration.should.have.property('slackWebhookUrl');
          assert.notEqual('slackWebhookUrl', 'http://test.com', 'should be encrypted');
          integration.should.have.property('metadata');
          done();
        });
    });

    it('should support decrypt param', (done) => {
      request(server)
        .get(url.concat('/ABCDEF123?decrypt=true'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          const integration = res.body;
          integration.should.have.property('teamId', 'ABCDEF123');
          integration.should.have.property('teamDomain', 'abcdomain');
          integration.should.have.property('createdAt');
          integration.should.have.property('slackSlashToken');
          assert.equal(integration.slackSlashToken, 'helloworld', 'should not be encrypted');
          integration.should.have.property('slackWebhookUrl');
          assert.equal(integration.slackWebhookUrl, 'http://test.com', 'should not be encrypted');
          integration.should.have.property('metadata');
          done();
        });
    });
    
    it('should 401 on missing auth params', (done) => {
      request(server)
        .get(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid auth', (done) => {
      request(server)
        .get(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', invalidAuth)
        .expect(403)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('PUT /subito/integrations/{teamId}', () => {
    it('should 200 on valid params', (done) => {
      request(server)
        .put(url.concat('/ABCDEF123'))
        .type('form')
        .send({
          teamDomain: 'newdomain'
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 200 on valid params', (done) => {
      request(server)
        .put(url.concat('/ABCDEF123'))
        .type('form')
        .send({
          teamDomain: 'newdomain',
          metadata: { hello: 'world' }
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 400 on invalid params', (done) => {
      request(server)
        .put(url.concat('/ABCDEF123'))
        .type('form')
        .send({
          hello_world: null
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(400)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
    
    it('should 401 on missing auth params', (done) => {
      request(server)
        .put(url.concat('/ABCDEF123'))
        .type('form')
        .send({
          teamDomain: 'newdomain',
          metadata: { hello: 'world' }
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid auth', (done) => {
      request(server)
        .put(url.concat('/ABCDEF123'))
        .type('form')
        .send({
          teamDomain: 'newdomain',
          metadata: { hello: 'world' }
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', invalidAuth)
        .expect(403)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('DELETE /subito/integrations/{teamId}', () => {
    it('should 200 on valid params', (done) => {
      request(server)
        .delete(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', validAuth)
        .expect(200)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
    
    it('should 401 on missing auth params', (done) => {
      request(server)
        .delete(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });

    it('should 403 on invalid auth', (done) => {
      request(server)
        .delete(url.concat('/ABCDEF123'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', invalidAuth)
        .expect(403)
        .end((err) => {
          should.not.exist(err);
          done();
        });
    });
  });
});
