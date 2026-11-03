const DEFAULT_BUCKET = 'kirki-payments';
const DEFAULT_BASE_URL = `http://host.docker.internal:9000/${DEFAULT_BUCKET}`;
const DEFAULT_ICON_BASE_URL = `http://localhost:9000/${DEFAULT_BUCKET}`;

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
 * Build the catalog list the store reads from `{base}/payments`.
 *
 * Sorted by `order`, then name. A gateway without `order` comes last.
 */
const buildCatalog = (metas, { baseUrl, iconBaseUrl }) =>
  [...metas].sort(compareGateways).map((meta) => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    version: meta.version,
    icon_url: `${trimTrailingSlashes(iconBaseUrl)}/${meta.slug}/logo.svg`,
    download_url: `${trimTrailingSlashes(baseUrl)}/${meta.slug}/${meta.slug}.zip`,
    sha256: meta.sha256,
  }));

const readBaseUrls = (env = process.env) => ({
  baseUrl: trimTrailingSlashes(env.BASE_URL || DEFAULT_BASE_URL),
  iconBaseUrl: trimTrailingSlashes(env.ICON_BASE_URL || DEFAULT_ICON_BASE_URL),
});

module.exports = {
  DEFAULT_BUCKET,
  DEFAULT_BASE_URL,
  DEFAULT_ICON_BASE_URL,
  buildCatalog,
  readBaseUrls,
};
