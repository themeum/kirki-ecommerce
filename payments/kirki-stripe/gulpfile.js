const path = require('path');
const { series } = require('gulp');
const deleteAsync = require('del');
const fs = require('fs');
const { execSync } = require('child_process');

const SOURCE_DIR = __dirname;
const KIRKI_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEST_DIR = path.join(KIRKI_ROOT, 'kirki-stripe');
const ECOMMERCE_DIR = path.join(KIRKI_ROOT, 'kirki-ecommerce');

function clean() {
    return deleteAsync([DEST_DIR], { force: true });
}

function copy() {
    fs.cpSync(SOURCE_DIR, DEST_DIR, { recursive: true });
    return Promise.resolve();
}

function dockerRebuild(done) {
    execSync('docker compose up -d --build', {
        cwd: ECOMMERCE_DIR,
        stdio: 'inherit',
    });
    done();
}

exports.default = series(clean, copy, dockerRebuild);
