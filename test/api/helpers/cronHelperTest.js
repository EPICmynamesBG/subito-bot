'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const testHelper = require('../../helper/testHelper');
const cronHelper = require('../../../api/helpers/cronHelper');
const parseSubito = require('../../../api/helpers/parseSubito');
const slack = require('../../../api/helpers/slack');

describe('cronHelper', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('importCalendar', () => {
    it('should not error', (done) => {
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(null, null);
      cronHelper.importCalendar(testHelper.db)((err, result) => {
        should.not.exist(err);
        assert(result.rows > 0);
        parseSubito.private.fetchSoupPage.restore();
        done();
      });
    });
  });

  describe('processSubscribers', () => {
    it('should not error', (done) => {
      sinon.stub(slack, 'messageUser').yields(null, { status: 'Success' });
      cronHelper.processSubscribers(testHelper.db)((err) => {
        should.not.exist(err);
        slack.messageUser.restore();
        done();
      });
    });
  });
});
