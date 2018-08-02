'use strict';

const _ = require('lodash');

const importer = require('../../../api/helpers/importer');
const sampleJson = require('../../data/calendar-pdf-json');

const TEST_URL = 'https://www.subitosoups.com/s/2018-August-Menu.pdf';

describe('importer', () => {
  describe('loadAndConvertPdf', () => {
    it('should load PDFs by url and convert them to JSON', (done) => {
      importer.loadAndConvertPdf(TEST_URL, (err, pdfJson) => {
        assert(!err, err);
        assert(pdfJson);
        done();
      });
    });

    it('should error when url is not for a PDF', (done) => {
      importer.loadAndConvertPdf('http://example.org', (err) => {
        assert(err, 'Error should occur');
        done();
      });
    });

    it('should error when no url', (done) => {
      importer.loadAndConvertPdf(null, (err) => {
        assert(err, 'Error should occur');
        done();
      });
    });
  });

  describe('extractFromPdf', () => {
    it('should extract calendar text from the raw PDF JSON', () => {
      const output = importer.extractFromPdf(sampleJson);

      assert(_.every(output, _.isString), 'all rows should be strings');
      assert.equal(output.length, 148);
    });

    it('should not error on invalid inputs', () => {
      let output = importer.extractFromPdf([]);
      assert.deepEqual(output, []);

      output = importer.extractFromPdf({});
      assert.deepEqual(output, []);

      output = importer.extractFromPdf(null);
      assert.deepEqual(output, []);
    });
  });

  describe('aggregateRows', () => {
    it('should aggregate text array to soup_calendar rows', () => {
      const extracted = importer.extractFromPdf(sampleJson);
      const rows = importer.aggregateRows(extracted);
      rows.forEach((row) => {
        assert(_.isString(row.date));
        assert(_.isArray(row.soups));
        assert(row.soups.length, 2, 'each row should have 2 soups');
      });
    });

    it('should return empty array when not in expected structure', () => {
      const rows = importer.aggregateRows(['hello world']);
      assert.equal(rows.length, 0);
    });
  });
});
