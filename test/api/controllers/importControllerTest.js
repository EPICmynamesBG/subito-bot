'use strict';

const should = require('should');
const importerService = require('../../../api/services/importerService');

describe('importController', () => {
  before(() => {
    sinon.stub(importerService, 'processUrl').yields(null, { text: 'PDF Processing' });
  });

  after(() => {
    importerService.processUrl.restore();
  });

  const body = {
    url: 'http://example.org',
    userName: 'bob'
  };
  describe('PUT /subito/import', () => {
    it('should add a subscriber', (done) => {
      request(server)
        .put('/subito/import')
        .send(body)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.have.property('text', "PDF Processing");
          done();
        });
    });
  });
});
