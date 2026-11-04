#!/usr/bin/env node
const path = require('path');
const { execFileSync } = require('child_process');

const { loadEnv } = require('./lib/load-env');
const { DEFAULT_BUCKET } = require('./lib/payment-catalog');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const GATEWAYS_DIR = path.join(ROOT, 'gateways');
const LOCAL_ENDPOINT = 'http://localhost:9000';

// Without S3_ENDPOINT the script targets the local MinIO container.
// An empty S3_ENDPOINT targets real AWS S3.
const endpoint = process.env.S3_ENDPOINT === undefined ? LOCAL_ENDPOINT : process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET || DEFAULT_BUCKET;
// Optional folder inside the bucket, for example "gateways".
const prefix = (process.env.S3_PREFIX || '').replace(/^\/+|\/+$/g, '');
const target = `s3://${bucket}/${prefix ? `${prefix}/` : ''}`;
const isLocal = endpoint === LOCAL_ENDPOINT;

if (!isLocal && !(process.env.BASE_URL && process.env.ICON_BASE_URL)) {
  console.error('Set BASE_URL and ICON_BASE_URL to the public bucket URL. The catalog would list local URLs.');
  process.exit(1);
}

const env = { ...process.env };

if (isLocal) {
  env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID || 'minioadmin';
  env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY || 'minioadmin';
  env.AWS_DEFAULT_REGION = env.AWS_DEFAULT_REGION || 'us-east-1';
}

const run = (command, args) => {
  execFileSync(command, args, { cwd: ROOT, env, stdio: 'inherit' });
};

const aws = (...args) => {
  try {
    run('aws', [...(endpoint ? ['--endpoint-url', endpoint] : []), 's3', ...args]);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('The AWS CLI is not installed. Install it from https://aws.amazon.com/cli/ and run again.');
      process.exit(1);
    }

    throw error;
  }
};

const main = () => {
  run('node', [path.join(__dirname, 'build-payment-zips.js')]);

  // Zips and logos first. Installs fail the hash check if the catalog lists a zip that is not uploaded yet.
  aws('cp', GATEWAYS_DIR, target, '--recursive', '--exclude', 'payments', '--exclude', '*/meta.json');

  // The catalog goes last, as JSON, with a short cache time.
  aws(
    'cp',
    path.join(GATEWAYS_DIR, 'payments'),
    `${target}payments`,
    '--content-type',
    'application/json',
    '--cache-control',
    'max-age=60',
  );

  console.log(`\nPublished to ${target} (${endpoint || 'AWS S3'})`);
};

main();
