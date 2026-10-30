const assert = require('node:assert');
const { describe, it } = require('node:test');

const { buildCatalog, readBaseUrls, DEFAULT_BASE_URL, DEFAULT_ICON_BASE_URL } = require('../lib/payment-catalog');

const urls = { baseUrl: 'http://api.test/bucket/', iconBaseUrl: 'http://icons.test/bucket' };

describe('buildCatalog', () => {
  it('lists a gateway with download and icon urls', () => {
    const metas = [
      { id: 'demo', slug: 'kirki-demo', name: 'Demo', description: 'Demo.', version: '1.2.3', order: 5, sha256: 'abc' },
    ];

    assert.deepStrictEqual(buildCatalog(metas, urls), [
      {
        id: 'demo',
        name: 'Demo',
        description: 'Demo.',
        version: '1.2.3',
        icon_url: 'http://icons.test/bucket/kirki-demo/logo.svg',
        download_url: 'http://api.test/bucket/kirki-demo/kirki-demo.zip',
        sha256: 'abc',
      },
    ]);
  });

  it('sorts by order, then name, with unordered gateways last', () => {
    const metas = [
      ['zeta', 'Zeta', 20],
      ['beta', 'Beta', null],
      ['alpha', 'Alpha', null],
      ['mid', 'Mid', 20],
      ['top', 'Top', 10],
    ].map(([id, name, order]) => ({ id, slug: id, name, order }));

    const ids = buildCatalog(metas, urls).map((gateway) => gateway.id);

    assert.deepStrictEqual(ids, ['top', 'mid', 'zeta', 'alpha', 'beta']);
  });
});

describe('readBaseUrls', () => {
  it('uses the local MinIO values by default', () => {
    assert.deepStrictEqual(readBaseUrls({}), { baseUrl: DEFAULT_BASE_URL, iconBaseUrl: DEFAULT_ICON_BASE_URL });
  });

  it('reads the env values and trims trailing slashes', () => {
    const env = { BASE_URL: 'https://cdn.example.com/p/', ICON_BASE_URL: 'https://cdn.example.com/p//' };

    assert.deepStrictEqual(readBaseUrls(env), {
      baseUrl: 'https://cdn.example.com/p',
      iconBaseUrl: 'https://cdn.example.com/p',
    });
  });
});
