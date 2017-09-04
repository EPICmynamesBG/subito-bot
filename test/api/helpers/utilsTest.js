'use strict';

const assert = require('assert');
const moment = require('moment');
const utils = require('../../../api/helpers/utils');

describe('utils', () => {
  describe('trimChar', () => {
    it('should trim the given character from a string', () => {
      let testString = '\nhello world\n\n';
      let output = utils.trimChar(testString, '\\n');
      assert.equal(output, 'hello world');

      testString = '~~ Hello ~~';
      output = utils.trimChar(testString, '~');
      assert.equal(output, ' Hello ');

      testString = 'abbababacaaa';
      output = utils.trimChar(testString, 'a');
      assert.equal(output, 'bbababac');
    });
  });

  describe('textForDate', () => {
    it('should parse a date/moment to text', () => {
      let input = moment().toDate(); // Today
      assert.equal(utils.textForDate(input), 'today', 'should be today');

      input = moment().add(1, 'd').toDate();
      assert.equal(utils.textForDate(input), 'tomorrow', 'should be tomorrow');

      input = moment().subtract(1, 'd').toDate();
      assert.equal(utils.textForDate(input), 'yesterday', 'should be yesterday');

      input = moment().add(5, 'd').toDate();
      assert.equal(utils.textForDate(input),  moment(input).format('dddd, MMM D'));
    });
  });

  describe('dateForText', () => {
    it('should parse text to Date', () => {
      let input;
      let output;
      let expected;

      expected = moment().toDate();
      output = utils.dateForText(input);
      assert(moment(output).isSame(expected), 'should be todays Date');

      input = 'Tomorrow';
      expected = moment().add(1, 'd').toDate();
      output = utils.dateForText(input);
      assert(moment(output).isSame(expected), 'should be tomorrows Date');

      input = 'yesterday';
      expected = moment().subtract(1, 'd').toDate();
      output = utils.dateForText(input);
      assert(moment(output).isSame(expected), 'should be yesterdays Date');

      input = '2017-06-03';
      expected = moment(input).toDate();
      output = utils.dateForText(input);
      assert(moment(output).isSame(expected), `should be Date for ${input}`);
    });

    it('defaults to current Date on invalid inputs', () => {
      let input = null;
      let output;
      const expected = moment().toDate();
      output = utils.dateForText(input);
      assert(moment(output).isSame(expected, 'day'), 'should be todays Date');
    });
  });

  describe('camelCase', () => {
    it('should camel case object properties', () => {
      const input = {
        test_input: 'A',
        helloWorld: 'B',
        HELLO_WORLD2: 'c'
      };
      const expected = {
        testInput: 'A',
        helloWorld: 'B',
        helloWorld2: 'c'
      };
      assert.deepEqual(utils.camelCase(input), expected);
    });

    it('should handle an array of objects', () => {
      const input = [{
        test_input: 'A',
        helloWorld: 'B',
        HELLO_WORLD2: 'c'
      }];
      const expected = [{
        testInput: 'A',
        helloWorld: 'B',
        helloWorld2: 'c'
      }];
      assert.deepEqual(utils.camelCase(input), expected);
    });
  });

  describe('snakeCase', () => {
    it('should snake case object properties', () => {
      const input = {
        testInput: 'A',
        helloWorld: 'B',
        helloWorld2: 'c'
      };
      const expected = {
        test_input: 'A',
        hello_world: 'B',
        hello_world_2: 'c'
      };
      assert.deepEqual(utils.snakeCase(input), expected);
    });

    it('should handle an array of objects', () => {
      const input = [{
        testInput: 'A',
        helloWorld: 'B',
        helloWorld2: 'c'
      }];
      const expected = [{
        test_input: 'A',
        hello_world: 'B',
        hello_world_2: 'c'
      }];
      assert.deepEqual(utils.snakeCase(input), expected);
    });
  });
});
