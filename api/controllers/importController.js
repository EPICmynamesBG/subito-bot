'use strict';

const utils = require('../helpers/utils');
const importerService = require('../services/importerService');

function importSoups(req, res) {
  const params = utils.getSwaggerParams(req);
  const { url, responseUrl, userName } = params.body;
  importerService.processUrl(req.db, url, {
    webhookUrl: req.fromSlack ? responseUrl : null,
    user: userName
  }, utils.processResponseCb(res));
}

module.exports = {
  importSoups: importSoups
};
