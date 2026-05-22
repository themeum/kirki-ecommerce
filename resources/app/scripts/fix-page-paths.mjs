import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOUBLED_SEGMENTS = [
  ['products/products/', 'products/'],
  ['orders/orders/', 'orders/'],
  ['collections/collections/', 'collections/'],
  ['customers/customers/', 'customers/'],
  ['settings/settings/', 'settings/'],
  ['tags/tags/', 'tags/'],
  ['brands/brands/', 'brands/'],
  ['categories/categories/', 'categories/'],
  ['bulk-edit/bulk-edit/', 'bulk-edit/'],
  ['inventory/inventory/', 'inventory/'],
];

const ROUTE_FIXES = [
  ['@/pages/products/products/edit-product', '@/pages/products/edit-product/edit-product'],
  ['@/pages/orders/orders/order-details', '@/pages/orders/order-details/order-details'],
  ['@/pages/collections/collections/collection-details', '@/pages/collections/collection-details/collection-details'],
  ['@/pages/customers/customers/customer-details', '@/pages/customers/customer-details/customer-details'],
  ['@/pages/customers/customers/customer-groups', '@/pages/customers/customer-groups/customer-groups'],
];

const fix = (content) => {
  let r = content;
  for (const [from, to] of ROUTE_FIXES) {
    r = r.split(from).join(to);
  }
  for (const [from, to] of DOUBLED_SEGMENTS) {
    while (r.includes(`@/pages/${from}`)) {
      r = r.split(`@/pages/${from}`).join(`@/pages/${to}`);
    }
    while (r.includes(`pages/${from}`)) {
      r = r.split(`pages/${from}`).join(`pages/${to}`);
    }
  }
  r = r.replace(/@\/Pages\//g, '@/pages/');
  r = r.replace(/from ['"]\.\.\/Pages\//g, "from '@/pages/");
  r = r.replace(/from ['"]\.\.\/\.\.\/Pages\//g, "from '@/pages/");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/Pages\//g, "from '@/pages/");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/Pages\//g, "from '@/pages/");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Pages\//g, "from '@/pages/");
  r = r.replace(/from ['"]\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  return r;
};

const walk = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walk(f);
    else if (/\.(js|jsx)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      const fixed = fix(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

console.log('Fixed', walk(APP_ROOT), 'files');
