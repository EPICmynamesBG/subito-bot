'use strict';

const lodash = require('lodash');

module.exports = {
  SLACK_CONSTS: {
    SUPPORTED_COMMANDS: lodash.clone(['day', 'search', 'subscribe', 'unsubscribe']),
    
    CMD_USAGE: {
      day: '[today | tomorrow | yesterday | [YYYY-MM-DD]]',
      search: '[soup name/type (example: gouda | gf)]',
      subscribe: '',
      unsubscribe: ''
    },

    CMD_PARAM_MAP: lodash.cloneDeep({
      day: ['day'],
      search: ['soup'],
      subscribe: [],
      unsubscribe: []
    }),

    CMD_TEMPLATE: lodash.cloneDeep({
      command: null,
      params: {
        user: {
          id: null,
          username: null
        }
      }
    })
  }
}
