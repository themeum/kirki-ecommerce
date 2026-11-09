const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');

const {
  buildCatalog,
  planBuild,
  readBaseUrls,
  readGatewayHeader,
  sourceSha256,
  DEFAULT_BASE_URL,
  DEFAULT_ICON_BASE_URL,
} = require('../lib/payment-catalog');

const urls = { baseUrl: 'http://api.test/bucket/', iconBaseUrl: 'http://icons.test/bucket' };

const gateway = (slug, version, sourceHash = `src-${slug}`) => ({
  id: slug,
  slug,
  name: slug,
  description: '',
  version,
  order: null,
  requires_kirki_ecommerce: '',
  requires_wp: '',
  requires_php: '',
  source_sha256: sourceHash,
});

const liveEntry = (slug, version, sourceHash = `src-${slug}`) => ({
  id: slug,
  slug,
  version,
  download_url: `http://api.test/bucket/${slug}/${slug}-${version}.zip`,
  sha256: `live-${slug}`,
  source_sha256: sourceHash,
});

describe('buildCatalog', () => {
  it('lists a gateway with all fields and a versioned download url', () => {
    const metas = [
      {
        id: 'demo',
        slug: 'kirki-demo',
        name: 'Demo',
        description: 'Demo.',
        version: '1.2.3',
        order: 5,
        requires_kirki_ecommerce: '1.1.0',
        requires_wp: '6.4',
        requires_php: '7.4',
        sha256: 'abc',
        source_sha256: 'def',
      },
    ];

    assert.deepStrictEqual(buildCatalog(metas, urls), [
      {
        id: 'demo',
        slug: 'kirki-demo',
        name: 'Demo',
        description: 'Demo.',
        version: '1.2.3',
        requires_kirki_ecommerce: '1.1.0',
        requires_wp: '6.4',
        requires_php: '7.4',
        icon_url: 'http://icons.test/bucket/kirki-demo/logo.svg',
        download_url: 'http://api.test/bucket/kirki-demo/kirki-demo-1.2.3.zip',
        sha256: 'abc',
        source_sha256: 'def',
      },
    ]);
  });

  it('gives empty requirements when none are set', () => {
    const [entry] = buildCatalog([{ id: 'a', slug: 'a', name: 'A', version: '1.0.0' }], urls);

    assert.strictEqual(entry.requires_kirki_ecommerce, '');
    assert.strictEqual(entry.requires_wp, '');
    assert.strictEqual(entry.requires_php, '');
  });

  it('sorts by order, then name, with unordered gateways last', () => {
    const metas = [
      ['zeta', 'Zeta', 20],
      ['beta', 'Beta', null],
      ['alpha', 'Alpha', null],
      ['mid', 'Mid', 20],
      ['top', 'Top', 10],
    ].map(([id, name, order]) => ({ id, slug: id, name, order }));

    const ids = buildCatalog(metas, urls).map((entry) => entry.id);

    assert.deepStrictEqual(ids, ['top', 'mid', 'zeta', 'alpha', 'beta']);
  });
});

describe('readGatewayHeader', () => {
  const header = `<?php
/**
 * Plugin Name:       Kirki PayFast
 * Description:       PayFast gateway.
 * Version:           1.0.1
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Requires Kirki eCommerce: 1.1.0
 * Order:             3
 */`;

  it('reads the catalog values and the requirements', () => {
    assert.deepStrictEqual(readGatewayHeader(header, 'kirki-payfast'), {
      slug: 'kirki-payfast',
      name: 'PayFast',
      description: 'PayFast gateway.',
      version: '1.0.1',
      order: 3,
      requires_kirki_ecommerce: '1.1.0',
      requires_wp: '6.4',
      requires_php: '7.4',
    });
  });

  it('gives empty requirements when the headers are missing', () => {
    const result = readGatewayHeader(' * Plugin Name: Kirki A\n * Version: 1.0.0', 'kirki-a');

    assert.strictEqual(result.requires_kirki_ecommerce, '');
    assert.strictEqual(result.requires_wp, '');
    assert.strictEqual(result.requires_php, '');
  });

  it('fails without a version', () => {
    assert.throws(() => readGatewayHeader(' * Plugin Name: Kirki A', 'kirki-a'), /needs "Plugin Name" and "Version"/);
  });

  it('fails on a version that cannot go in a file name', () => {
    assert.throws(() => readGatewayHeader(' * Plugin Name: A\n * Version: 1.0/2', 'kirki-a'), /cannot go in a file name/);
  });
});

describe('planBuild', () => {
  it('builds a gateway that is not in the live catalog', () => {
    const plan = planBuild([gateway('kirki-new', '1.0.0')], [], urls);

    assert.deepStrictEqual(
      plan.build.map((g) => g.slug),
      ['kirki-new'],
    );
    assert.deepStrictEqual(plan.keep, []);
  });

  it('builds a gateway whose version changed', () => {
    const plan = planBuild([gateway('kirki-a', '1.0.1')], [liveEntry('kirki-a', '1.0.0')], urls);

    assert.deepStrictEqual(
      plan.build.map((g) => g.slug),
      ['kirki-a'],
    );
  });

  it('keeps a gateway with the same version and its live hashes', () => {
    const plan = planBuild([gateway('kirki-a', '1.0.0')], [liveEntry('kirki-a', '1.0.0')], urls);

    assert.deepStrictEqual(plan.build, []);
    assert.strictEqual(plan.keep.length, 1);
    assert.strictEqual(plan.keep[0].sha256, 'live-kirki-a');
    assert.strictEqual(plan.keep[0].source_sha256, 'src-kirki-a');
    assert.deepStrictEqual(plan.changedWithoutBump, []);
  });

  it('warns when the source changed but the version did not', () => {
    const plan = planBuild([gateway('kirki-a', '1.0.0', 'new-hash')], [liveEntry('kirki-a', '1.0.0', 'old-hash')], urls);

    assert.deepStrictEqual(plan.changedWithoutBump, ['kirki-a']);
    assert.deepStrictEqual(plan.build, []);
    assert.strictEqual(plan.keep[0].source_sha256, 'old-hash');
  });

  it('keeps the live zip values, not the edited header, when the version did not change', () => {
    const edited = {
      ...gateway('kirki-a', '1.0.0', 'new-hash'),
      id: 'edited-id',
      name: 'Edited name',
      description: 'Edited description.',
      order: 5,
      requires_kirki_ecommerce: '1.0.1',
      requires_wp: '6.6',
      requires_php: '8.1',
    };
    const live = {
      ...liveEntry('kirki-a', '1.0.0', 'old-hash'),
      name: 'Live name',
      description: 'Live description.',
      requires_kirki_ecommerce: '',
      requires_wp: '6.4',
      requires_php: '',
    };

    const [kept] = planBuild([edited], [live], urls).keep;

    assert.strictEqual(kept.id, 'kirki-a');
    assert.strictEqual(kept.name, 'Live name');
    assert.strictEqual(kept.description, 'Live description.');
    assert.strictEqual(kept.requires_kirki_ecommerce, '');
    assert.strictEqual(kept.requires_wp, '6.4');
    assert.strictEqual(kept.requires_php, '');
    assert.strictEqual(kept.order, 5);
    assert.strictEqual(kept.sha256, 'live-kirki-a');
  });

  it('lists live gateways that have no folder as removed', () => {
    const plan = planBuild([gateway('kirki-a', '1.0.0')], [liveEntry('kirki-a', '1.0.0'), liveEntry('kirki-old', '1.0.0')], urls);

    assert.deepStrictEqual(plan.removed, ['kirki-old']);
  });

  it('asks for --full when a live entry has no slug', () => {
    const live = [{ id: 'a', version: '1.0.0', sha256: 'x' }];

    assert.throws(() => planBuild([gateway('kirki-a', '1.0.0')], live, urls), /--full/);
  });

  it('asks for --full when a kept entry has no source_sha256', () => {
    const live = [{ ...liveEntry('kirki-a', '1.0.0'), source_sha256: undefined }];

    assert.throws(() => planBuild([gateway('kirki-a', '1.0.0')], live, urls), /--full/);
  });

  it('asks for --full when a kept download_url is not under BASE_URL', () => {
    const live = [{ ...liveEntry('kirki-a', '1.0.0'), download_url: 'http://other.test/kirki-a/kirki-a-1.0.0.zip' }];

    assert.throws(() => planBuild([gateway('kirki-a', '1.0.0')], live, urls), /--full/);
  });

  it('asks for --full when the live catalog is not a list', () => {
    assert.throws(() => planBuild([], { error: true }, urls), /--full/);
  });
});

describe('sourceSha256', () => {
  const makeGateway = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirki-source-'));
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'kirki-a.php'), '<?php // main');
    fs.writeFileSync(path.join(dir, 'src', 'A.php'), '<?php // a');
    return dir;
  };

  it('does not change for vendor, node_modules or .DS_Store files', () => {
    const dir = makeGateway();
    const before = sourceSha256(dir);

    fs.mkdirSync(path.join(dir, 'vendor'));
    fs.writeFileSync(path.join(dir, 'vendor', 'autoload.php'), '<?php');
    fs.mkdirSync(path.join(dir, 'node_modules'));
    fs.writeFileSync(path.join(dir, 'node_modules', 'x.js'), '');
    fs.writeFileSync(path.join(dir, '.DS_Store'), 'x');

    assert.strictEqual(sourceSha256(dir), before);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('changes when a source file changes', () => {
    const dir = makeGateway();
    const before = sourceSha256(dir);

    fs.writeFileSync(path.join(dir, 'src', 'A.php'), '<?php // changed');

    assert.notStrictEqual(sourceSha256(dir), before);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('changes when a file is renamed', () => {
    const dir = makeGateway();
    const before = sourceSha256(dir);

    fs.renameSync(path.join(dir, 'src', 'A.php'), path.join(dir, 'src', 'B.php'));

    assert.notStrictEqual(sourceSha256(dir), before);
    fs.rmSync(dir, { recursive: true, force: true });
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
