import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_OLD = path.join(__dirname, '../Pages');
const STAGING = path.join(__dirname, '../__pages_staging__');
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
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const oldRel = rel ? `${rel}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkOld(full, oldRel);
      continue;
    }
    if (!/\.(js|jsx)$/.test(entry.name)) continue;

    const content = fs.readFileSync(full, 'utf8');
    const kebabParts = oldRel
      .split('/')
      .map((seg) => toKebab(seg.replace(/\.(js|jsx)$/, '')));
    const isIndex = /^index\.(js|jsx)$/.test(entry.name);
    const isJsx = entry.name.endsWith('.jsx') || hasJsx(content);
    const parentKebab = kebabParts[kebabParts.length - 2];

    let destRel;
    if (!isJsx) {
      destRel = `${kebabParts.join('/')}.js`;
    } else if (isIndex && parentKebab) {
      destRel = `${kebabParts.slice(0, -1).join('/')}/${parentKebab}.jsx`;
    } else if (isIndex) {
      destRel = `${kebabParts[kebabParts.length - 1]}.jsx`;
    } else {
      destRel = `${kebabParts.join('/')}.jsx`;
    }

    const dest = path.join(STAGING, destRel);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, content);
  }
};

rmrf(STAGING);
ensureDir(STAGING);
if (!fs.existsSync(PAGES_OLD)) {
  console.error('Pages directory not found — restore with: git checkout HEAD -- resources/app/Pages');
  process.exit(1);
}
walkOld(PAGES_OLD);
rmrf(PAGES_OLD);
if (fs.existsSync(PAGES_NEW)) {
  rmrf(PAGES_NEW);
}
fs.renameSync(STAGING, PAGES_NEW);

const fixPagesImports = (content, filePath) => {
  let r = content;
  r = r.replace(/@\/Pages\//g, '@/pages/');
  r = r.replace(/from ['"]((?:\.\.\/)+)Pages\//g, (m, dots) => `from '${dots}pages/`);
  r = r.replace(/from ['"]\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
  r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");

  r = r.replace(/from ['"]\.\/([A-Za-z][A-Za-z0-9]*)['"]/g, (m, name) => {
    const dir = path.dirname(filePath);
    const kebab = toKebab(name);
    const target = path.join(dir, `${kebab}.jsx`);
    const targetIndex = path.join(dir, kebab, `${kebab}.jsx`);
    if (fs.existsSync(target)) {
      const rel = path.relative(dir, target).replace(/\\/g, '/').replace(/\.jsx$/, '');
      return `from './${rel}'`;
    }
    if (fs.existsSync(targetIndex)) {
      const rel = path.relative(dir, targetIndex).replace(/\\/g, '/').replace(/\.jsx$/, '');
      return `from './${rel}'`;
    }
    return m;
  });

  return r;
};

const walkPages = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walkPages(f);
    else if (/\.(js|jsx)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      const fixed = fixPagesImports(c, f);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

const walkAppPagesRefs = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'pages'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walkAppPagesRefs(f);
    else if (/\.(js|jsx)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      if (!c.includes('Pages') && !c.includes('Settings/utils')) continue;
      let r = c.replace(/@\/Pages\//g, '@/pages/');
      r = r.replace(/from ['"]((?:\.\.\/)+)Pages\//g, (m, dots) => `from '${dots}pages/`);
      r = r.replace(/from ['"]\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
      r = r.replace(/from ['"]\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
      r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
      r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
      r = r.replace(/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Settings\/utils['"]/g, "from '@/pages/settings/utils'");
      if (r !== c) {
        fs.writeFileSync(f, r);
        n++;
      }
    }
  }
  return n;
};

console.log('Fixed page file imports:', walkPages(PAGES_NEW));
console.log('Fixed app refs:', walkAppPagesRefs(APP_ROOT));
