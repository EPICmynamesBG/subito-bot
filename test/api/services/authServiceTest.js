'use strict';

const assert = require('assert');
const testHelper = require('../../helper/testHelper');
const authService = require('../../../api/services/authService');

describe('authService', () => {
  before(testHelper.resetData);
  after(testHelper.clearData);

  describe('validateTeamToken', () => {
    it('should validate a token + team id pair', (done) => {
      const teamId = 'ABCDEF123';
      const rawToken = 'helloworld';
      authService.validateTeamToken(testHelper.db, teamId, rawToken, (valid) => {
        assert.equal(valid, true);
        done();
      });
    });

    it('should fail', (done) => {
      const teamId = 'ABCDEF123';
      const rawToken = 'bad token';
      authService.validateTeamToken(testHelper.db, teamId, rawToken, (valid) => {
        assert.equal(valid, false);
        done();
      });
    });
  });
});
