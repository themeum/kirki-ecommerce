const { createApp } = require('./app');
const { createConfig } = require('./config');

const config = createConfig();
const server = createApp(config).listen(config.port, () => {
  console.log(`Payment server listening on port ${config.port}`);
  console.log(`  catalog:   ${config.baseUrl}/payments`);
  console.log(`  icons:     ${config.iconBaseUrl}/files/<slug>/logo.svg`);
  console.log(`  gateways dir: ${config.gatewaysDir}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Stop the other process or set PORT.`);
    process.exit(1);
  }

  throw error;
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
