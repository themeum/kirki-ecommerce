const express = require('express');

const { createPaymentsRouter } = require('./routes/payments');

const createApp = (config) => {
  const app = express();

  app.disable('x-powered-by');

  app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', '*');
    next();
  });

  app.get('/health', (request, response) => {
    response.json({ status: 'ok' });
  });

  app.use(createPaymentsRouter(config));

  app.use((request, response) => {
    response.status(404).json({ message: 'Not found' });
  });

  app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).json({ message: 'Internal server error' });
  });

  return app;
};

module.exports = { createApp };
