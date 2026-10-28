const fs = require('fs');
const path = require('path');

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

const readGateways = ({ gatewaysDir, baseUrl, iconBaseUrl }) => {
  if (!fs.existsSync(gatewaysDir)) {
    return [];
  }

  return fs
    .readdirSync(gatewaysDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(gatewaysDir, entry.name, 'meta.json'))
    .filter((metaFile) => fs.existsSync(metaFile))
    .map((metaFile) => JSON.parse(fs.readFileSync(metaFile, 'utf8')))
    .sort(compareGateways)
    .map((meta) => {
      return {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        version: meta.version,
        icon_url: `${iconBaseUrl}/files/${meta.slug}/logo.svg`,
        download_url: `${baseUrl}/files/${meta.slug}/${meta.slug}.zip`,
        sha256: meta.sha256,
      };
    });
};

module.exports = { readGateways };
