'use strict';

const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const request = require('request');
const moment = require('moment');
const lodash = require('lodash');
const slack = require('../../../api/helpers/slack');

const SLACK_CONSTS = require('../../../config/constants').SLACK_CONSTS;

describe('slack helper', () => {
  describe('utils', () =>{
    describe('parseRequestCommand', () => {
      it('should support param as string or object', () => {
        let input = {
          body: {
            text: 'August 23, 2017',
            user_id: 'ABC123',
            user_name: 'bobbyboy'
          }
        };
        let output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = 'August 23, 2017';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy'
        };
        assert.deepEqual(output, expected);

        input = 'August 23, 2017';
        output = slack.utils.parseRequestCommand(input);
        expected.params.user = {
          id: null,
          username: null
        };
        assert.deepEqual(output, expected);
      });

      it('should support default to a day lookup', () => {
        const text = '';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = null;
        assert.deepEqual(output, expected);
      });

      it('should default to "day" with a param value', () => {
        const text = 'August 23, 2017';
        let output = slack.utils.parseRequestCommand(text);
        let expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = text;
        assert.deepEqual(output, expected);
        
        output = slack.utils.parseRequestCommand('tomorrow');
        expected.params.day = 'tomorrow';
        assert.deepEqual(output, expected);
      });

      it('should support "day" command', () => {
        const text = 'day August 23, 2017';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = 'August 23, 2017';
        assert.deepEqual(output, expected);
      });

      it('should support "search" command', () => {
        const text = 'search corn chowder';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'search';
        expected.params.soup = 'corn chowder';
        assert.deepEqual(output, expected);
      });

      it('should support "subscribe" command', () => {
        let input = {
          body: {
            text: 'subscribe',
            user_id: 'ABC123',
            user_name: 'bobbyboy'
          }
        };
        const output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'subscribe';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy'
        };
        assert.deepEqual(output, expected);
      });

      it('should ignore command case', () => {
        const text = 'DaY August 23, 2017';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = 'August 23, 2017';
        assert.deepEqual(output, expected);
      });

      it('should return command with params.unknown when unsupported', () => {
        const text = 'hello bob barker';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'hello';
        expected.params.unknown = 'bob barker';
        assert.deepEqual(output, expected);
      });
    });
  });
});
