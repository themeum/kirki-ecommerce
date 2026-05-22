import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_OLD = path.join(__dirname, '../Pages');
const STAGING = path.join(__dirname, '../pages.__staging__');
const PAGES_NEW = path.join(__dirname, '../pages');
const APP_ROOT = path.join(__dirname, '..');

const toKebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const hasJsx = (content) => /<[A-Za-z]/.test(content) || content.includes('<>');

const rmrf = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e);
    fs.statSync(f).isDirectory() ? rmrf(f) : fs.unlinkSync(f);
  }
  fs.rmdirSync(dir);
};

const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });

const walkOld = (dir, rel = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const oldRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      walkOld(path.join(dir, entry.name), oldRel);
      continue;
    }
    if (!/\.(js|jsx)$/.test(entry.name)) {
      continue;
    }

    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
    const kebabRel = oldRel
      .split('/')
      .map((seg) => toKebab(seg.replace(/\.(js|jsx)$/, '')))
      .join('/');

    const parts = kebabRel.split('/');
    const fileBase = parts[parts.length - 1];
    const parentKebab = parts[parts.length - 2];
    const isIndex = entry.name.startsWith('index.');
    const isJsx = entry.name.endsWith('.jsx') || hasJsx(content);

    let destRel;
    if (!isJsx) {
      destRel = kebabRel + '.js';
    } else if (isIndex && parentKebab) {
      destRel = `${parts.slice(0, -1).join('/')}/${parentKebab}.jsx`;
    } else if (isIndex && parts.length === 1) {
      destRel = `${fileBase}.jsx`;
    } else {
      destRel = `${parts.slice(0, -1).join('/')}/${fileBase}.jsx`;
    }

    const dest = path.join(STAGING, destRel);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, content);
  }
};

rmrf(STAGING);
ensureDir(STAGING);

if (!fs.existsSync(PAGES_OLD)) {
  console.error('Pages folder not found');
  process.exit(1);
}

walkOld(PAGES_OLD);
rmrf(PAGES_OLD);
ensureDir(PAGES_NEW);

const copyTree = (s, d) => {
  ensureDir(d);
  for (const e of fs.readdirSync(s)) {
    const sf = path.join(s, e);
    const df = path.join(d, e);
    fs.statSync(sf).isDirectory() ? copyTree(sf, df) : fs.copyFileSync(sf, df);
  }
};
copyTree(STAGING, PAGES_NEW);
rmrf(STAGING);

const ROUTE_MAP = [];

const buildRouteMap = (dir, prefix = 'pages') => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = `${prefix}/${e.name.replace(/\.(js|jsx)$/, '')}`;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      buildRouteMap(full, rel);
    } else if (e.name.endsWith('.jsx')) {
      const oldPascal = e.name.replace('.jsx', '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      ROUTE_MAP.push({ file: rel, full: `@/${rel}` });
    }
  }
};

const fixPaths = (content) => {
  let r = content;
  r = r.replace(/@\/Pages\//g, '@/pages/');
  r = r.replace(/from ['"]((?:\.\.\/)+)Pages\/([^'"]+)['"]/g, (m, dots, p) => {
    return `from '${dots}pages/${p.split('/').map(toKebab).join('/')}'`;
  });
  r = r.replace(/from ['"]\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  return r;
};

const walkFix = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'pages.__staging__'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walkFix(f);
    else if (/\.(js|jsx)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      const fixed = fixPaths(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

const ROUTE_REPLACEMENTS = [
  ['@/Pages/Products', '@/pages/products/products'],
  ['@/Pages/Products/EditProduct', '@/pages/products/edit-product/edit-product'],
  ['@/Pages/BulkEdit', '@/pages/bulk-edit/bulk-edit'],
  ['@/Pages/Inventory', '@/pages/inventory/inventory'],
  ['@/Pages/Orders', '@/pages/orders/orders'],
  ['@/Pages/Orders/OrderDetails', '@/pages/orders/order-details/order-details'],
  ['@/Pages/Collections', '@/pages/collections/collections'],
  ['@/Pages/Collections/CollectionDetails', '@/pages/collections/collection-details/collection-details'],
  ['@/Pages/Tags', '@/pages/tags/tags'],
  ['@/Pages/Categories', '@/pages/categories/categories'],
  ['@/Pages/Brands', '@/pages/brands/brands'],
  ['@/Pages/Customers', '@/pages/customers/customers'],
  ['@/Pages/Customers/CustomerDetails', '@/pages/customers/customer-details/customer-details'],
  ['@/Pages/Customers/CustomerGroups', '@/pages/customers/customer-groups/customer-groups'],
  ['@/Pages/Settings', '@/pages/settings/settings'],
  ['@/Pages/Settings/GeneralSettings', '@/pages/settings/general-settings/general-settings'],
  ['@/Pages/Settings/ProductsSettings', '@/pages/settings/products-settings/products-settings'],
  ['@/Pages/Settings/PaymentSettings', '@/pages/settings/payment-settings/payment-settings'],
  ['@/Pages/Settings/ShippingSettings', '@/pages/settings/shipping-settings/shipping-settings'],
  ['@/Pages/Settings/ShippingSettings/ShippingZone/ShippingZone', '@/pages/settings/shipping-settings/shipping-zone/shipping-zone'],
  ['@/Pages/Settings/TaxSettings', '@/pages/settings/tax-settings/tax-settings'],
  ['@/Pages/Settings/EmailSettings', '@/pages/settings/email-settings/email-settings'],
  ['@/Pages/Settings/ShippingSettings/ShippingMethod/ShippingDeliveryMethod', '@/pages/settings/shipping-settings/shipping-method/shipping-delivery-method'],
  ['@/Pages/Settings/MultiCurrencySettings', '@/pages/settings/multi-currency-settings/multi-currency-settings'],
  ['@/Pages/Settings/CheckoutSettings', '@/pages/settings/checkout-settings/checkout-settings'],
  ['@/Pages/Settings/EmailSettings/EditTemplate', '@/pages/settings/email-settings/edit-template'],
  ['@/Pages/Settings/TaxSettings/TaxRegion/GeneralEditRegion', '@/pages/settings/tax-settings/tax-region/general-edit-region'],
  ['@/Pages/Settings/TaxSettings/TaxRegion/EditRegionEU', '@/pages/settings/tax-settings/tax-region/edit-region-eu'],
  ['@/Pages/Settings/EssentialSettings', '@/pages/settings/essential-settings/essential-settings'],
  ['@/Pages/Settings/EssentialSettings/VariationLibrary/ColorVariation', '@/pages/settings/essential-settings/variation-library/color-variation'],
  ['@/Pages/Settings/EssentialSettings/VariationLibrary/ListVariation', '@/pages/settings/essential-settings/variation-library/list-variation'],
  ['@/Pages/NotFound', '@/pages/not-found/not-found'],
];

const fixRoutes = (content) => {
  let r = content;
  for (const [from, to] of ROUTE_REPLACEMENTS) {
    r = r.split(from).join(to);
  }
  return fixPaths(r);
};

const walkRoutes = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walkRoutes(f);
    else if (/\.(js|jsx)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      const fixed = fixRoutes(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

console.log('Pages tree migrated');
console.log('Fixed paths in', walkRoutes(APP_ROOT), 'files');
