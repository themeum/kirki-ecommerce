import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BARREL_EXPORTS } from './molecule-exports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOLECULES = path.join(__dirname, '../molecules');
const APP_ROOT = path.join(__dirname, '..');

const COMPONENT_PATH = Object.fromEntries(
  Object.entries(BARREL_EXPORTS).map(([name, p]) => [name, `@/molecules/${p}`]),
);

const fixContent = (content) => {
  let result = content;
  for (const [name, alias] of Object.entries(COMPONENT_PATH)) {
    result = result.replace(
      new RegExp(`from ['"]\\.\\./${name}['"]`, 'g'),
      `from '${alias}'`,
    );
    result = result.replace(
      new RegExp(`from ['"]\\.\\./\\.\\./${name}['"]`, 'g'),
      `from '${alias}'`,
    );
    result = result.replace(
      new RegExp(`from ['"]\\.\\./${name}/index['"]`, 'g'),
      `from '${alias}'`,
    );
  }

  const folderImports = [
    ['@/molecules/select', '@/molecules/select/select'],
    ['@/molecules/tag-manager', '@/molecules/tag-manager/tag-manager'],
    ['@/molecules/radio-group', '@/molecules/radio-group/radio-group'],
  ];

  for (const [wrong, right] of folderImports) {
    result = result.replace(
      new RegExp(`from '${wrong}'`, 'g'),
      `from '${right}'`,
    );
    result = result.replace(
      new RegExp(`from "${wrong}"`, 'g'),
      `from '${right}'`,
    );
  }

  const tableRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/molecules\/table['"];?/gs;
  result = result.replace(tableRegex, (match, namesBlock) => {
    const names = namesBlock.split(',').map((s) => s.trim()).filter(Boolean);
    return names
      .map((name) => {
        const parts = name.split(/\s+as\s+/);
        const exportName = parts[0].trim();
        const localName = (parts[1] || parts[0]).trim();
        const moleculePath = BARREL_EXPORTS[exportName];
        return `import ${localName} from '@/${['molecules', moleculePath].join('/')}';`;
      })
      .join('\n');
  });

  return result;
};

const walk = (dir) => {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'scripts') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      n += walk(full);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const fixed = fixContent(content);
      if (fixed !== content) {
        fs.writeFileSync(full, fixed);
        n += 1;
      }
    }
  }
  return n;
};

const count = walk(APP_ROOT);
console.log(`Fixed relative imports in ${count} files`);
