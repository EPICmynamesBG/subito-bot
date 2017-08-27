'use strict';

const lodash = require('lodash');

module.exports = {
  SLACK_CONSTS: {
    SUPPORTED_COMMANDS: lodash.clone(['day', 'search', 'subscribe']),

    CMD_PARAM_MAP: lodash.cloneDeep({
      day: ['day'],
      search: ['soup'],
      subscribe: []
    }),

    CMD_TEMPLATE: lodash.cloneDeep({
      command: null,
      params: {
        user: {
          id: null,
          username: null
        }
      }
    }),

    CMD_TEMPLATE_DEFAULT: lodash.cloneDeep({
      command: 'day',
      params: {
        day: null,
        user: {
          id: null,
          username: null
        }
      }
    })
  }
}
