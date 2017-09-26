'use strict';

const assert = require('assert');
const should = require('should');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const testHelper = require('../../helper/testHelper');
const cronHelper = require('../../../api/helpers/cronHelper');
const parseSubito = require('../../../api/helpers/parseSubito');
const slack = require('../../../api/helpers/slack');

const testHtml = fs.readFileSync(path.join(__dirname, '../../data') + '/test-calendar.html', 'utf-8');

describe('cronHelper', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);
  describe('importCalendar', () => {
    it('should not error', (done) => {
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(null, null);
      sinon.stub(fs, 'readFile').yields(null, testHtml);
      cronHelper.importCalendar(testHelper.db)((err, result) => {
        should.not.exist(err);
        assert(result.rows > 0);
        parseSubito.private.fetchSoupPage.restore();
        fs.readFile.restore();
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
