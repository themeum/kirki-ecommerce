import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const toKebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const resolveSpec = (fromDir, spec) => {
  if (!spec.startsWith('.')) return null;
  const parts = spec.split('/');
  const up = parts.filter((p) => p === '..').length;
  const rest = parts.filter((p) => p !== '.' && p !== '..');
  const kebabRest = rest.map(toKebab);

  let base = fromDir;
  for (let i = 0; i < up; i++) base = path.dirname(base);

  const tryPaths = [
    path.join(base, ...kebabRest) + '.jsx',
    path.join(base, ...kebabRest) + '.js',
    path.join(base, ...kebabRest.slice(0, -1), kebabRest[kebabRest.length - 1], `${kebabRest[kebabRest.length - 1]}.jsx`),
  ];

  for (const target of tryPaths) {
    if (fs.existsSync(target)) {
      let rel = path.relative(fromDir, target).replace(/\\/g, '/');
      rel = rel.replace(/\.(jsx|js)$/, '');
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return rel;
    }
  }
  return null;
};

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  let changed = false;

  const patterns = [
    /from ['"](\.[^'"]+)['"]/g,
    /import\(['"](\.[^'"]+)['"]\)/g,
  ];

  for (const pattern of patterns) {
    content = content.replace(pattern, (match, spec) => {
      if (!/[A-Z]/.test(spec)) return match;
      const resolved = resolveSpec(dir, spec);
      if (!resolved) return match;
      changed = true;
      const q = match.includes("'") ? "'" : '"';
      if (match.startsWith('import(')) {
        return `import(${q}${resolved}${q})`;
      }
      return `from ${q}${resolved}${q}`;
    });
  }

  if (changed) fs.writeFileSync(filePath, content);
  return changed;
};

const walk = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walk(f);
    else if (/\.(js|jsx)$/.test(e.name) && fixFile(f)) n++;
  }
  return n;
};

let total = 0;
for (let i = 0; i < 5; i++) {
  const n = walk(APP);
  total += n;
  if (n === 0) break;
}
console.log('Fixed', total, 'files');
