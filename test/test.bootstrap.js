process.env.NODE_ENV='test';

const moment = require('moment');

global.assert = require('assert');
global.sinon = require('sinon');
global.request = require('supertest');
global.lodash = require('lodash');

global.moment = moment;
global.server = require('../app');
