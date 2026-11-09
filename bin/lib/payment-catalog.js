const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_BUCKET = 'kirki-payments';
const DEFAULT_BASE_URL = `http://host.docker.internal:9000/${DEFAULT_BUCKET}`;
const DEFAULT_ICON_BASE_URL = `http://localhost:9000/${DEFAULT_BUCKET}`;
const SOURCE_EXCLUDES = ['vendor', 'node_modules', '.git', '.DS_Store'];
const FULL_BUILD_HINT = 'Run the build with --full to rebuild all gateways.';

const trimTrailingSlashes = (url) => url.replace(/\/+$/, '');

const hasOrder = (meta) => Number.isFinite(meta.order);

const compareGateways = (a, b) => {
  if (hasOrder(a) !== hasOrder(b)) {
    return hasOrder(a) ? -1 : 1;
  }

  if (hasOrder(a) && a.order !== b.order) {
    return a.order - b.order;
  }

  return a.name.localeCompare(b.name);
};

/**
 * Read one field of a plugin header comment. A missing field gives ''.
 */
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

/**
 * Read the catalog values of a gateway from its plugin header comment.
 */
const readGatewayHeader = (header, slug) => {
  const name = stripBrandPrefix(readHeaderField(header, 'Plugin Name'));
  const version = readHeaderField(header, 'Version');

  if (!name || !version) {
    throw new Error(`[${slug}] plugin header needs "Plugin Name" and "Version"`);
  }

  if (!/^[0-9A-Za-z.+-]+$/.test(version)) {
    throw new Error(`[${slug}] plugin header "Version" has characters that cannot go in a file name: "${version}"`);
  }

  return {
    slug,
    name,
    description: readHeaderField(header, 'Description'),
    version,
    order: readOrder(header, slug),
    requires_kirki: readHeaderField(header, 'Requires Kirki'),
    requires_wp: readHeaderField(header, 'Requires at least'),
    requires_php: readHeaderField(header, 'Requires PHP'),
  };
};

const zipFileName = (meta) => `${meta.slug}-${meta.version}.zip`;

const downloadUrl = (baseUrl, meta) => `${trimTrailingSlashes(baseUrl)}/${meta.slug}/${zipFileName(meta)}`;

/**
 * Hash the source of a gateway: the sorted relative paths and contents of its
 * files, without dependencies and system files.
 */
const sourceSha256 = (dir) => {
  const files = [];

  const walk = (current) => {
    fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      if (SOURCE_EXCLUDES.includes(entry.name)) {
        return;
      }

      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        files.push(path.relative(dir, full).split(path.sep).join('/'));
      }
    });
  };

  walk(dir);

  const hash = crypto.createHash('sha256');
  files.sort().forEach((file) => {
    hash.update(`${file}\0`);
    hash.update(fs.readFileSync(path.join(dir, file)));
    hash.update('\0');
  });

  return hash.digest('hex');
};

/**
 * Decide which gateways to build from the live catalog.
 *
 * A gateway is built when the live catalog has no entry for its slug, or when
 * its version differs. Otherwise it is kept with the live `sha256` and
 * `source_sha256`. Throws when the live catalog cannot be trusted for a merge.
 */
const planBuild = (gateways, liveCatalog, { baseUrl }) => {
  if (!Array.isArray(liveCatalog)) {
    throw new Error(`The live catalog is not a list. ${FULL_BUILD_HINT}`);
  }

  const liveBySlug = new Map();

  liveCatalog.forEach((entry) => {
    if (!entry || typeof entry.slug !== 'string' || entry.slug === '') {
      throw new Error(`The live catalog has an entry without "slug" (${entry && entry.id}). ${FULL_BUILD_HINT}`);
    }

    liveBySlug.set(entry.slug, entry);
  });

  const plan = { build: [], keep: [], removed: [], changedWithoutBump: [] };

  gateways.forEach((gateway) => {
    const live = liveBySlug.get(gateway.slug);

    if (!live || live.version !== gateway.version) {
      plan.build.push(gateway);
      return;
    }

    if (typeof live.sha256 !== 'string' || typeof live.source_sha256 !== 'string') {
      throw new Error(`[${gateway.slug}] the live entry has no "sha256" or "source_sha256". ${FULL_BUILD_HINT}`);
    }

    if (live.download_url !== downloadUrl(baseUrl, gateway)) {
      throw new Error(`[${gateway.slug}] the live download_url does not match BASE_URL. ${FULL_BUILD_HINT}`);
    }

    if (live.source_sha256 !== gateway.source_sha256) {
      plan.changedWithoutBump.push(gateway.slug);
    }

    plan.keep.push({ ...gateway, sha256: live.sha256, source_sha256: live.source_sha256 });
  });

  const slugs = new Set(gateways.map((gateway) => gateway.slug));
  plan.removed = liveCatalog.filter((entry) => !slugs.has(entry.slug)).map((entry) => entry.slug);

  return plan;
};

/**
 * Build the catalog list the store reads from `{base}/payments`.
 *
 * Sorted by `order`, then name. A gateway without `order` comes last.
 */
const buildCatalog = (metas, { baseUrl, iconBaseUrl }) =>
  [...metas].sort(compareGateways).map((meta) => ({
    id: meta.id,
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    version: meta.version,
    requires_kirki: meta.requires_kirki || '',
    requires_wp: meta.requires_wp || '',
    requires_php: meta.requires_php || '',
    icon_url: `${trimTrailingSlashes(iconBaseUrl)}/${meta.slug}/logo.svg`,
    download_url: downloadUrl(baseUrl, meta),
    sha256: meta.sha256,
    source_sha256: meta.source_sha256,
  }));

const readBaseUrls = (env = process.env) => ({
  baseUrl: trimTrailingSlashes(env.BASE_URL || DEFAULT_BASE_URL),
  iconBaseUrl: trimTrailingSlashes(env.ICON_BASE_URL || DEFAULT_ICON_BASE_URL),
});

module.exports = {
  DEFAULT_BUCKET,
  DEFAULT_BASE_URL,
  DEFAULT_ICON_BASE_URL,
  FULL_BUILD_HINT,
  buildCatalog,
  downloadUrl,
  planBuild,
  readBaseUrls,
  readGatewayHeader,
  readHeaderField,
  sourceSha256,
  zipFileName,
};
