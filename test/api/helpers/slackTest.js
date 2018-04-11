'use strict';

const SlackNode = require('slack-node');

const slack = require('../../../api/helpers/slack');
const SLACK_CONSTS = require('../../../config/constants').SLACK_CONSTS;

describe('slack helper', () => {
  describe('messageUserAsBot', () => {
    it('should send a message', (done) => {
      sinon.stub(SlackNode.prototype, 'api')
        .onCall(0).yields(null, { ok: true, channel: { id: 'channel-id' } })
        .onCall(1).yields(null, { ok: true });
      slack.messageUserAsBot('user', 'some message', 'bot-token', (err, res) => {
        assert(!err, err);
        assert(res.ok);
        SlackNode.prototype.api.restore();
        done();
      });
    });

    it('should error on im.open', (done) => {
      sinon.stub(SlackNode.prototype, 'api')
        .onCall(0).yields(null, { ok: false, error: 'some-error' });
      slack.messageUserAsBot('user', 'some message', 'bot-token', (err) => {
        assert.equal(err.message, 'An unexpected error occurred');
        SlackNode.prototype.api.restore();
        done();
      });
    });

    it('should error on chat.postMessage', (done) => {
      sinon.stub(SlackNode.prototype, 'api')
        .onCall(0).yields(null, { ok: true, channel: { id: 'channel-id' } })
        .onCall(1).yields(null, { ok: false, error: 'some-error' });
      slack.messageUserAsBot('user', 'some message', 'bot-token', (err) => {
        assert.equal(err.message, 'An unexpected error occurred');
        SlackNode.prototype.api.restore();
        done();
      });
    });
  });

  describe('utils', () => {
    describe('parseRequestCommand', () => {
      it('should support param as string or object', () => {
        let input = {
          text: 'August 23, 2017',
          userId: 'ABC123',
          userName: 'bobbyboy',
          teamId: '123XYZ',
          teamDomain: 'testteam'
        };
        let output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'day';
        expected.params.day = 'August 23, 2017';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy',
          teamId: '123XYZ',
          teamDomain: 'testteam'
        };
        assert.deepEqual(output, expected);

        input = 'August 23, 2017';
        output = slack.utils.parseRequestCommand(input);
        expected.params.user = {
          id: null,
          username: null,
          teamId: null,
          teamDomain: null
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
        expected.params.search = 'corn chowder';
        assert.deepEqual(output, expected);
      });

      it('should support "subscribe" command', () => {
        let input = {
          text: 'subscribe',
          user_id: 'ABC123',
          user_name: 'bobbyboy',
          team_id: '123XYZ',
          team_domain: 'test'
        };
        const output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'subscribe';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy',
          teamId: '123XYZ',
          teamDomain: 'test'
        };
        expected.params.search = null;
        assert.deepEqual(output, expected);
      });

      it('should support "subscribe" command with search term', () => {
        let input = {
          text: 'subscribe corn',
          user_id: 'ABC123',
          user_name: 'bobbyboy',
          team_id: '123XYZ',
          team_domain: 'test'
        };
        const output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'subscribe';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy',
          teamId: '123XYZ',
          teamDomain: 'test'
        };
        expected.params.search = 'corn';
        assert.deepEqual(output, expected);
      });

      it('should support "unsubscribe" command', () => {
        let input = {
          text: 'unsubscribe',
          user_id: 'ABC123',
          user_name: 'bobbyboy',
          team_id: '123XYZ',
          team_domain: 'test'
        };
        const output = slack.utils.parseRequestCommand(input);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'unsubscribe';
        expected.params.user = {
          id: 'ABC123',
          username: 'bobbyboy',
          teamId: '123XYZ',
          teamDomain: 'test'
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

      it('should support "feedback" command', () => {
        const text = 'feedback';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'feedback';
        assert.deepEqual(output, expected);
      });

      it('should support "settings" command', () => {
        const text = 'settings notify 8:00';
        const output = slack.utils.parseRequestCommand(text);
        const expected = lodash.cloneDeep(SLACK_CONSTS.CMD_TEMPLATE);
        expected.command = 'settings';
        expected.params.notify = { time: '8:00' };
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
