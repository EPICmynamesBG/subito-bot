'use strict';

const lodash = require('lodash');
const logger = require('../helpers/logger');
const utils = require('../helpers/utils');
const moment = require('moment');
const config = require('../../config/config');
const subscriberService = require('../services/subscriberService');

function subscribe(req, res) {
  const params = utils.getSwaggerParams(req);
  logger.debug(req.url, params);
  
  subscriberService.addSubscriber(req.db, params, (err, res) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        text: 'An unexpected server error occured'
      });
      return;
    }
    res.json({ text: res.text });
  });
}

function unsubscribe(req, res) {
  const params = utils.getSwaggerParams(req);
  logger.debug(req.url, params);
  
  const handleResponse = function(err, res) {
    if (err) {
      logger.error(err);
      res.status(500).json({
        text: 'An unexpected server error occured'
      });
      return;
    }
    res.json({ text: res.text });
  };
  
  if (params.id) {
    subscriberService.deleteSubscriberById(req.db, params.id, handleResponse);
  } else if (params.slackUserId) {
    subscriberService.deleteSubscriberById(req.db, params.slackUserId, handleResponse);
  } else if (params.slackUsername) {
    subscriberService.deleteSubscriberById(req.db, params.slackUsername, handleResponse);
  } else {
    logger.debug(404, 'Missing one of required: id, slackUserId, slackUsername');
    res.status(400).json({
      text: 'Missing one of required: id, slackUserId, slackUsername'
    });
  }
}

module.exports = {
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  unsubscribe2: unsubscribe
};
