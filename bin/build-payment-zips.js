#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { loadEnv } = require('./lib/load-env');
const {
  FULL_BUILD_HINT,
  buildCatalog,
  planBuild,
  readBaseUrls,
  readGatewayHeader,
  sourceSha256,
  zipFileName,
} = require('./lib/payment-catalog');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const PAYMENTS_DIR = path.join(ROOT, 'payments');
const OUTPUT_DIR = path.join(ROOT, 'gateways');
const CATALOG_FILE = path.join(OUTPUT_DIR, 'payments');
const SLUG_PREFIX = 'kirki-';
const STAGING_EXCLUDES = ['vendor', 'node_modules', '.git', '.DS_Store'];
const ZIP_EXCLUDES = ['*.DS_Store', '*/composer.lock', '*/.git/*'];

const run = (command, args, cwd) => {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
};

const listGatewaySlugs = () =>
  fs
    .readdirSync(PAYMENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(SLUG_PREFIX))
    .map((entry) => entry.name)
    .sort();

const readProviderId = (gatewayDir, slug) => {
  const srcDir = path.join(gatewayDir, 'src');
  const files = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter((file) => file.endsWith('.php')) : [];

  for (const file of files) {
    const source = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const match = source.match(/\$this->id\s*=\s*'([^']+)'/);
    if (match) {
      return match[1];
    }
  }

  return slug.slice(SLUG_PREFIX.length);
};

const readChangelog = (gatewayDir) => {
  const file = path.join(gatewayDir, 'CHANGELOG.md');

  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
};

/**
 * Read the values of one gateway folder without building it.
 */
const readGateway = (slug) => {
  const gatewayDir = path.join(PAYMENTS_DIR, slug);
  const mainFile = path.join(gatewayDir, `${slug}.php`);

  if (!fs.existsSync(mainFile)) {
    console.warn(`[${slug}] skipped: ${slug}.php not found`);
    return null;
  }

  if (!fs.existsSync(path.join(gatewayDir, 'assets', 'logo.svg'))) {
    throw new Error(`[${slug}] assets/logo.svg is missing`);
  }

  return {
    ...readGatewayHeader(fs.readFileSync(mainFile, 'utf8'), slug),
    id: readProviderId(gatewayDir, slug),
    source_sha256: sourceSha256(gatewayDir),
  };
};

const installDependencies = (stagingDir, slug) => {
  if (!fs.existsSync(path.join(stagingDir, 'composer.json'))) {
    return;
  }

  const hasLock = fs.existsSync(path.join(stagingDir, 'composer.lock'));
  const command = hasLock ? 'install' : 'update';

  if (!hasLock) {
    console.warn(`[${slug}] no composer.lock, running "composer update"`);
  }

  run('composer', [command, '--no-dev', '--optimize-autoloader', '--no-interaction', '--no-progress'], stagingDir);
};

const buildGateway = (gateway) => {
  const { slug } = gateway;
  const gatewayDir = path.join(PAYMENTS_DIR, slug);
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirki-payment-'));
  const stagingDir = path.join(workDir, slug);

  try {
    fs.cpSync(gatewayDir, stagingDir, {
      recursive: true,
      filter: (source) => !STAGING_EXCLUDES.includes(path.basename(source)),
    });

    installDependencies(stagingDir, slug);

    const outputDir = path.join(OUTPUT_DIR, slug);
    const zipFile = path.join(outputDir, zipFileName(gateway));
    fs.mkdirSync(outputDir, { recursive: true });

    run('zip', ['-r', '-q', '-X', zipFile, slug, '-x', ...ZIP_EXCLUDES], workDir);

    fs.copyFileSync(path.join(gatewayDir, 'assets', 'logo.svg'), path.join(outputDir, 'logo.svg'));

    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');
    const meta = { ...gateway, changelog: readChangelog(gatewayDir), sha256 };
    fs.writeFileSync(path.join(outputDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

    return meta;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
};

const fetchLiveCatalog = async (iconBaseUrl) => {
  const url = `${iconBaseUrl}/payments`;
  let response;

  try {
    response = await fetch(url, { cache: 'no-store' });
  } catch (error) {
    throw new Error(`Could not load the live catalog from ${url} (${error.message}). ${FULL_BUILD_HINT}`);
  }

  if (!response.ok) {
    throw new Error(`Could not load the live catalog from ${url} (HTTP ${response.status}). ${FULL_BUILD_HINT}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`The live catalog at ${url} is not JSON. ${FULL_BUILD_HINT}`);
  }
};

const printSummary = (plan, catalog) => {
  const relative = (file) => path.relative(ROOT, file);

  if (plan.build.length > 0) {
    console.log(`\nBuilt ${plan.build.length} gateway(s). Upload these folders:`);
    plan.build.forEach((g) => console.log(`  ${relative(path.join(OUTPUT_DIR, g.slug))}/  (${g.id} v${g.version})`));
  } else {
    console.log('\nNo gateway was built.');
  }

  if (plan.keep.length > 0) {
    console.log(`\nKept ${plan.keep.length} gateway(s) from the live catalog (do not upload):`);
    plan.keep.forEach((g) => console.log(`  ${g.slug} v${g.version}`));
  }

  if (plan.removed.length > 0) {
    console.log('\nRemoved from the catalog (no folder in payments/):');
    plan.removed.forEach((slug) => console.log(`  ${slug}`));
  }

  plan.changedWithoutBump.forEach((slug) => {
    console.warn(`\nWARNING: [${slug}] the source changed but the version did not. Change its "Version" header to ship it.`);
  });

  console.log(`\nCatalog: ${relative(CATALOG_FILE)} (${catalog.length} gateway(s)). Upload it last.`);
};

const main = async () => {
  const full = process.argv.includes('--full');
  const urls = readBaseUrls();
  const gateways = listGatewaySlugs()
    .map(readGateway)
    .filter((gateway) => gateway !== null);

  const plan = full
    ? { build: gateways, keep: [], removed: [], changedWithoutBump: [] }
    : planBuild(gateways, await fetchLiveCatalog(urls.iconBaseUrl), urls);

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const built = plan.build.map(buildGateway);
  const catalog = buildCatalog([...built, ...plan.keep], urls);
  fs.writeFileSync(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);

  printSummary(plan, catalog);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
