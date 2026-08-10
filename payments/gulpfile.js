const path = require('path');
const fs = require('fs');
const { series } = require('gulp');
const deleteAsync = require('del');
const { execSync } = require('child_process');

const PAYMENTS_DIR = __dirname;
const KIRKI_ROOT = path.resolve(__dirname, '..', '..');
const ECOMMERCE_DIR = path.join(KIRKI_ROOT, 'kirki-ecommerce');

// Do not delete the main kirki-ecommerce dir.
const PROTECTED_DIRS = ['kirki-ecommerce'];

const EXCLUDED_DIRS = ['vendor'];

function listDirs(dir) {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}

function clean() {
    const targets = listDirs(KIRKI_ROOT)
        .filter((name) => name.startsWith('kirki-') && !PROTECTED_DIRS.includes(name))
        .map((name) => path.join(KIRKI_ROOT, name));

    return deleteAsync(targets, { force: true });
}

function copy(done) {
    const gateways = listDirs(PAYMENTS_DIR).filter((name) => name.startsWith('kirki-'));

    gateways.forEach((name) => {
      fs.cpSync(path.join(PAYMENTS_DIR, name), path.join(KIRKI_ROOT, name), {
        recursive: true,
        filter: (src) => !EXCLUDED_DIRS.includes(path.basename(src)),
      });
    });

    done();
}

function composerInstall(done) {
  const gateways = listDirs(PAYMENTS_DIR).filter((name) => name.startsWith('kirki-'));

  gateways.forEach((name) => {
    const gatewayDir = path.join(KIRKI_ROOT, name);
    const composerFile = path.join(gatewayDir, 'composer.json');

    if (!fs.existsSync(composerFile)) {
      return; // skip gateways without composer.json
    }
    execSync('composer install', {
      cwd: path.join(KIRKI_ROOT, name),
      stdio: 'inherit',
    });
  });

  done();
}

function dockerRebuild(done) {
    execSync('docker compose up -d --build', {
        cwd: ECOMMERCE_DIR,
        stdio: 'inherit',
    });
    done();
}

exports.default = series(clean, copy, composerInstall, dockerRebuild);

