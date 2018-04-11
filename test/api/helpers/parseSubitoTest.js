'use strict';

const fs = require('fs');
const path = require('path');
const parseSubito = require('../../../api/helpers/parseSubito');

const testHtml = fs.readFileSync(path.join(__dirname, '../../data') + '/test-calendar.html', 'utf-8');

describe('parseSubito', () => {
  describe('fetchCalendar', () => {
    it('should try to continue even if soup page load fails', (done) => {
      const reqErr = new Error('404');
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(reqErr);

      parseSubito.fetchCalendar((err) => {
        assert.notEqual(err, reqErr);
        parseSubito.private.fetchSoupPage.restore();
        done();
      });
    });

    it('should gracefully fail if soup page was not loaded/saved', (done) => {
      const fileErr = new Error('File not found');
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(null, null);
      sinon.stub(fs, 'readFile').yields(fileErr);

      parseSubito.fetchCalendar((err, results) => {
        assert.equal(err, fileErr);
        assert.equal(results, undefined);
        parseSubito.private.fetchSoupPage.restore();
        fs.readFile.restore();
        done();
      });
    });

    it('should successfully parse html to object array', (done) => {
      sinon.stub(parseSubito.private, 'fetchSoupPage').yields(null, null);
      sinon.stub(fs, 'readFile').yields(null, testHtml);

      parseSubito.fetchCalendar((err, results) => {
        assert.equal(err, null);
        assert(results.length > 0, 'must have results to test against');
        /* eslint-disable max-nested-callbacks */
        results.forEach((soupDay) => {
          assert(soupDay.date instanceof Date, 'date should be a Date object');
          assert.equal(soupDay.soups.length, 2, 'each day should have 2 soups');
        });
        /* eslint-enable max-nested-callbacks */
        parseSubito.private.fetchSoupPage.restore();
        fs.readFile.restore();
        done();
      });
    });
  });
});
