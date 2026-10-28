const express = require('express');

const { readGateways } = require('../catalog');

const createPaymentsRouter = (config) => {
  const router = express.Router();

  router.get('/payments', (request, response) => {
    response.json(readGateways(config));
  });

  router.use('/files', express.static(config.gatewaysDir, { dotfiles: 'deny', index: false }));

  return router;
};

module.exports = { createPaymentsRouter };
