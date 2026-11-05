#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { loadEnv } = require('./lib/load-env');
const { DEFAULT_BUCKET, DEFAULT_PREFIX, readPresetData, checkPresetData, stagePresetData } = require('./lib/preset-data');

loadEnv();

// The script targets real AWS S3 with the AWS CLI's own credentials. Its
// variables have a PRESETS_ prefix, so the payments script's S3_* values in
// .env never send the presets to the payments bucket.
const endpoint = process.env.PRESETS_S3_ENDPOINT || '';
const bucket = process.env.PRESETS_S3_BUCKET || DEFAULT_BUCKET;
const prefix = (process.env.PRESETS_S3_PREFIX === undefined ? DEFAULT_PREFIX : process.env.PRESETS_S3_PREFIX).replace(/^\/+|\/+$/g, '');
const target = `s3://${bucket}/${prefix ? `${prefix}/` : ''}`;

const aws = (...args) => {
  try {
    execFileSync('aws', [...(endpoint ? ['--endpoint-url', endpoint] : []), 's3', ...args], { stdio: 'inherit' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('The AWS CLI is not installed. Install it from https://aws.amazon.com/cli/ and run again.');
      process.exit(1);
    }

    throw error;
  }
};

const JSON_OPTIONS = ['--content-type', 'application/json', '--cache-control', 'max-age=60'];

const main = () => {
  const data = readPresetData();
  const errors = checkPresetData(data);

  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    console.error(`\n${errors.length} problem(s) in the preset data. Nothing was uploaded.`);
    process.exit(1);
  }

  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirki-presets-'));

  try {
    stagePresetData(data, stageDir);

    // Images first, then the product lists that name them, then the presets last.
    aws('cp', stageDir, target, '--recursive', '--exclude', '*.json');
    aws('cp', stageDir, target, '--recursive', '--exclude', '*', '--include', '*/products.json', ...JSON_OPTIONS);
    aws('cp', path.join(stageDir, 'presets.json'), `${target}presets.json`, ...JSON_OPTIONS);
  } finally {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }

  console.log(`\nPublished to ${target} (${endpoint || 'AWS S3'})`);
};

main();
