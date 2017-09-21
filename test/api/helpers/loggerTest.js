'use strict';

const assert = require('assert');
const logger = require('../../../api/helpers/logger');

describe('logger', () => {
  it('should support level "fatal"', () => {
    assert.doesNotThrow(() => {
      logger.fatal('Test');
    });
  });
  it('should support level "error"', () => {
    assert.doesNotThrow(() => {
      logger.error('Test');
    });
  });
  it('should support level "warn"', () => {
    assert.doesNotThrow(() => {
      logger.warn('Test');
    });
  });
  it('should support level "info"', () => {
    assert.doesNotThrow(() => {
      logger.info('Test');
    });
  });
  it('should support level "analytics"', () => {
    assert.doesNotThrow(() => {
      logger.analytics('Test');
    });
  });
  it('should support level "verbose"', () => {
    assert.doesNotThrow(() => {
      logger.verbose('Test');
    });
  });
  it('should support level "debug"', () => {
    assert.doesNotThrow(() => {
      logger.debug('Test');
    });
  });
  it('should support level "silly"', () => {
    assert.doesNotThrow(() => {
      logger.silly('Test');
    });
  });
});
