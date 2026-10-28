#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAYMENTS_DIR = path.join(ROOT, 'payments');
const OUTPUT_DIR = path.join(ROOT, 'payment-server', 'gateways');
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

const readHeaderField = (source, field) => {
  const match = source.match(new RegExp(`^\\s*\\*?\\s*${field}:\\s*(.+)$`, 'mi'));
  return match ? match[1].trim() : '';
};

const stripBrandPrefix = (name) => name.replace(/^kirki\s+/i, '');

const readOrder = (header, slug) => {
  const value = readHeaderField(header, 'Order');

  if (value === '') {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`[${slug}] plugin header "Order" must be a whole number, got "${value}"`);
  }

  return Number(value);
};

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

const buildGateway = (slug) => {
  const gatewayDir = path.join(PAYMENTS_DIR, slug);
  const mainFile = path.join(gatewayDir, `${slug}.php`);
  const logoFile = path.join(gatewayDir, 'assets', 'logo.svg');

  if (!fs.existsSync(mainFile)) {
    console.warn(`[${slug}] skipped: ${slug}.php not found`);
    return null;
  }

  if (!fs.existsSync(logoFile)) {
    throw new Error(`[${slug}] assets/logo.svg is missing`);
  }

  const header = fs.readFileSync(mainFile, 'utf8');
  const name = stripBrandPrefix(readHeaderField(header, 'Plugin Name'));
  const version = readHeaderField(header, 'Version');
  const description = readHeaderField(header, 'Description');
  const order = readOrder(header, slug);

  if (!name || !version) {
    throw new Error(`[${slug}] plugin header needs "Plugin Name" and "Version"`);
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirki-payment-'));
  const stagingDir = path.join(workDir, slug);

  try {
    fs.cpSync(gatewayDir, stagingDir, {
      recursive: true,
      filter: (source) => !STAGING_EXCLUDES.includes(path.basename(source)),
    });

    installDependencies(stagingDir, slug);

    const outputDir = path.join(OUTPUT_DIR, slug);
    const zipFile = path.join(outputDir, `${slug}.zip`);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.rmSync(zipFile, { force: true });

    run('zip', ['-r', '-q', '-X', zipFile, slug, '-x', ...ZIP_EXCLUDES], workDir);

    fs.copyFileSync(logoFile, path.join(outputDir, 'logo.svg'));

    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');
    const meta = { id: readProviderId(gatewayDir, slug), slug, name, description, version, order, sha256 };
    fs.writeFileSync(path.join(outputDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

    return meta;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
};

const main = () => {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const built = listGatewaySlugs()
    .map(buildGateway)
    .filter((meta) => meta !== null);

  console.log(`\nBuilt ${built.length} payment gateway zip(s) in ${path.relative(ROOT, OUTPUT_DIR)}:`);
  built.forEach((meta) => console.log(`  ${meta.id} (${meta.slug}) v${meta.version}`));
};

main();
