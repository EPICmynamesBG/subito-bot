'use strict';

const lodash = require('lodash');

module.exports = {
  SLACK_CONSTS: {
    SUPPORTED_COMMANDS: lodash.clone(['day', 'search', 'subscribe', 'unsubscribe', 'feedback']),

    CMD_USAGE: {
      day: '[today | tomorrow | yesterday | [YYYY-MM-DD]]',
      search: '[soup name/type (example: gouda | gf)]',
      subscribe: '[search (example: corn)]',
      unsubscribe: '',
      feedback: '<https://github.com/EPICmynamesBG/subito-bot/issues|Submit feedback on GitHub>'
    },

    CMD_PARAM_MAP: lodash.cloneDeep({
      day: ['day'],
      search: ['search'],
      subscribe: ['search'],
      unsubscribe: [],
      feedback: []
    }),

    CMD_TEMPLATE: lodash.cloneDeep({
      command: null,
      params: {
        user: {
          id: null,
          username: null,
          teamId: null,
          teamDomain: null
        }
      }
    })
  }
}
