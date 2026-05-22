import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BARREL_EXPORTS } from './molecule-exports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('@/molecules')) {
    return false;
  }

  const barrelRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/molecules['"];?/gs;
  let modified = false;

  content = content.replace(barrelRegex, (match, namesBlock) => {
    modified = true;
    const names = namesBlock
      .split(',')
      .map((s) => s.trim().replace(/\n/g, ' '))
      .filter(Boolean);

    return names
      .map((name) => {
        const parts = name.split(/\s+as\s+/);
        const exportName = parts[0].trim();
        const localName = (parts[1] || parts[0]).trim();
        const moleculePath = BARREL_EXPORTS[exportName];
        if (!moleculePath) {
          console.warn(`Unknown export ${exportName} in ${filePath}`);
          return `import { ${exportName} } from '@/molecules/UNKNOWN';`;
        }
        return `import ${localName} from '@/${['molecules', moleculePath].join('/')}';`;
      })
      .join('\n');
  });

  content = content.replace(
    /import\s+(\w+)\s+from\s+['"]@\/molecules['"];?/g,
    () => {
      modified = true;
      return '';
    },
  );

  if (modified) {
    content = content.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(filePath, content);
  }

  return modified;
};

const walk = (dir) => {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'molecules.__staging__'].includes(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += walk(full);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      if (fixFile(full)) {
        count += 1;
      }
    }
  }
  return count;
};

const updated = walk(APP_ROOT);
console.log(`Updated ${updated} files`);
