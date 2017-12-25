'use strict';

const utils = require('../helpers/utils');
const teamIntegrationService = require('../services/teamIntegrationService');

// DEPRECATED
function addIntegration(req, res) {
  const params = req.body;
  teamIntegrationService.addIntegration(req.db, params, (err, results) => {
    if (err || !results) {
      utils.processResponse(err, results, res);
      return;
    }
    utils.processResponse(null, { text: results.text }, res);
  });
}

// DEPRECATED
function getAllIntegrations(req, res) {
  teamIntegrationService.getAllIntegrations(req.db, (err, results) => {
    if (err) {
      utils.processResponse(err, results, res);
      return;
    }
    if (results === null) {
      utils.processResponse(null, [], res);
      return;
    }
    utils.processResponse(null, results, res);
  });
}

// DEPRECATED
function getIntegrationById(req, res) {
  const teamId = req.swagger.params.teamId.value;
  const decrypt = req.swagger.params.decrypt.value;
  teamIntegrationService.getIntegrationById(req.db, teamId, decrypt, utils.processResponseCb(res));
}

// DEPRECATED
function updateIntegration(req, res) {
  const teamId = req.swagger.params.teamId.value;
  const params = req.body;
  teamIntegrationService.updateIntegration(req.db, teamId, params, (err, results) => {
    if (err || !results) {
      utils.processResponse(err, results, res);
      return;
    }
    utils.processResponse(null, { text: results.text }, res);
  });
}

// DEPRECATED
function deleteIntegration(req, res) {
  const teamId = req.swagger.params.teamId.value;
  teamIntegrationService.removeIntegration(req.db, teamId, (err, results) => {
    if (err || !results) {
      utils.processResponse(err, results, res);
      return;
    }
    utils.processResponse(null, { text: results.text }, res);
  });
}

module.exports = {
  addIntegration: addIntegration,
  getAllIntegrations: getAllIntegrations,
  getIntegrationById: getIntegrationById,
  updateIntegration: updateIntegration,
  deleteIntegration: deleteIntegration
};
