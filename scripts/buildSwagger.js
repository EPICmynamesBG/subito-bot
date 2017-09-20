'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../api/helpers/logger');
const swaggerConfig = require('../config/config').SWAGGER;

const host = `${swaggerConfig.HOSTNAME}:${swaggerConfig.PORT}`;

const schemes = swaggerConfig.SCHEMAS.reduce((str, val) => {
  return str.concat(`\t- "${val}"\n`);
}, '');

let swaggerYaml = fs.readFileSync(path.join(__dirname, '../api/swagger') + '/index.yaml', 'utf-8');

swaggerYaml = swaggerYaml.replace(/\{appVersion\}/g, `"${swaggerConfig.APP_VERSION}"`);

swaggerYaml = swaggerYaml.replace(/\{host\}/g, `"${host}"`);

swaggerYaml = swaggerYaml.replace(/\{basepath\}/g, `"${swaggerConfig.BASEPATH}"`);

swaggerYaml = swaggerYaml.replace(/\{schemes\}/g, schemes);

fs.writeFileSync(path.join(__dirname, '../api/swagger') + '/swagger.yaml', swaggerYaml);

logger.info(`BuildSwagger complete - ${process.env.NODE_ENV}`);
process.exit(0);
