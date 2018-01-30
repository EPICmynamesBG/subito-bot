process.env.NODE_ENV='test';

const { DEFAULT_TIMEZONE } = require('../config/config');
const moment = require('moment-timezone');

moment.tz.setDefault(DEFAULT_TIMEZONE);

global.assert = require('assert');
global.sinon = require('sinon');
global.request = require('supertest');
global.lodash = require('lodash');

global.moment = moment;
global.server = require('../app');
