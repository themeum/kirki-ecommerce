const fs = require('fs');
const path = require('path');

/**
 * Load the repo `.env` file into `process.env`.
 *
 * A value that is already set in the shell wins over the file.
 */
const loadEnv = () => {
  const envFile = path.resolve(__dirname, '..', '..', '.env');

  if (fs.existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
};

module.exports = { loadEnv };
