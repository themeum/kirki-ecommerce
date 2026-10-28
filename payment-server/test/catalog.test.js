const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const { createApp } = require('../src/app');

describe('payment server', () => {
  let gatewaysDir;
  let server;
  let origin;

  before(async () => {
    gatewaysDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payment-server-'));
    fs.mkdirSync(path.join(gatewaysDir, 'kirki-demo'));
    fs.writeFileSync(path.join(gatewaysDir, 'kirki-demo', 'kirki-demo.zip'), 'zip-bytes');
    fs.writeFileSync(path.join(gatewaysDir, 'kirki-demo', 'logo.svg'), '<svg/>');
    fs.writeFileSync(
      path.join(gatewaysDir, 'kirki-demo', 'meta.json'),
      JSON.stringify({ id: 'demo', slug: 'kirki-demo', name: 'Kirki Demo', description: 'Demo.', version: '1.2.3', sha256: 'abc' }),
    );

    const config = { gatewaysDir, baseUrl: 'http://api.test', iconBaseUrl: 'http://icons.test' };

    await new Promise((resolve) => {
      server = createApp(config).listen(0, resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    fs.rmSync(gatewaysDir, { recursive: true, force: true });
  });

  it('lists built gateways with download and icon urls', async () => {
    const gateways = await (await fetch(`${origin}/payments`)).json();

    assert.deepStrictEqual(gateways, [
      {
        id: 'demo',
        name: 'Kirki Demo',
        description: 'Demo.',
        version: '1.2.3',
        icon_url: 'http://icons.test/files/kirki-demo/logo.svg',
        download_url: 'http://api.test/files/kirki-demo/kirki-demo.zip',
        sha256: 'abc',
      },
    ]);
  });

  it('picks up a gateway added after start', async () => {
    fs.mkdirSync(path.join(gatewaysDir, 'kirki-new'));
    fs.writeFileSync(
      path.join(gatewaysDir, 'kirki-new', 'meta.json'),
      JSON.stringify({ id: 'new', slug: 'kirki-new', name: 'New', description: '', version: '1.0.0', sha256: 'def' }),
    );

    const gateways = await (await fetch(`${origin}/payments`)).json();

    assert.strictEqual(gateways.length, 2);
  });

  it('serves the zip file', async () => {
    const response = await fetch(`${origin}/files/kirki-demo/kirki-demo.zip`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(await response.text(), 'zip-bytes');
  });

  it('does not serve files outside the gateways directory', async () => {
    const response = await fetch(`${origin}/files/%2e%2e/package.json`);

    assert.strictEqual(response.status, 404);
  });

  it('answers the health check', async () => {
    const body = await (await fetch(`${origin}/health`)).json();

    assert.deepStrictEqual(body, { status: 'ok' });
  });
});

describe('gateway ordering', () => {
  it('sorts by order, then name, with unordered gateways last', () => {
    const { readGateways } = require('../src/catalog');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'payment-order-'));
    const entries = [
      ['zeta', 'Zeta', 20],
      ['beta', 'Beta', undefined],
      ['alpha', 'Alpha', undefined],
      ['mid', 'Mid', 20],
      ['top', 'Top', 10],
    ];

    entries.forEach(([id, name, order]) => {
      fs.mkdirSync(path.join(dir, id));
      fs.writeFileSync(path.join(dir, id, 'meta.json'), JSON.stringify({ id, slug: id, name, order }));
    });

    const ids = readGateways({ gatewaysDir: dir, baseUrl: 'http://a', iconBaseUrl: 'http://a' }).map((g) => g.id);
    fs.rmSync(dir, { recursive: true, force: true });

    assert.deepStrictEqual(ids, ['top', 'mid', 'zeta', 'alpha', 'beta']);
  });
});
