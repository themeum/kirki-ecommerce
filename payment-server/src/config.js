const path = require('path');

const trimTrailingSlashes = (url) => url.replace(/\/+$/, '');

const createConfig = (env = process.env) => {
  const port = Number(env.PORT || 4800);

  return {
    port,
    baseUrl: trimTrailingSlashes(env.BASE_URL || `http://host.docker.internal:${port}`),
    iconBaseUrl: trimTrailingSlashes(env.ICON_BASE_URL || `http://localhost:${port}`),
    gatewaysDir: path.resolve(env.GATEWAYS_DIR || path.join(__dirname, '..', 'gateways')),
  };
};

module.exports = { createConfig };
