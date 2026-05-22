import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BARREL_EXPORTS } from './molecule-exports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..');

const fixContent = (content) => {
  let result = content;
  let modified = false;

  const barrelRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+molecules['"];?/gs;
  result = result.replace(barrelRegex, (match, namesBlock) => {
      modified = true;
      const names = namesBlock.split(',').map((s) => s.trim().replace(/\n/g, ' ')).filter(Boolean);
      return names
        .map((name) => {
          const parts = name.split(/\s+as\s+/);
          const exportName = parts[0].trim();
          const localName = (parts[1] || parts[0]).trim();
          const moleculePath = BARREL_EXPORTS[exportName];
          if (!moleculePath) {
            console.warn(`Unknown: ${exportName}`);
            return match;
          }
          return `import ${localName} from '@/${['molecules', moleculePath].join('/')}';`;
        })
        .join('\n');
  });

  for (const [name, moleculePath] of Object.entries(BARREL_EXPORTS)) {
    const patterns = [
      new RegExp(`import\\s+${name}\\s+from\\s+['"](?:\\.\\./)+molecules/${name}['"];?`, 'g'),
      new RegExp(`import\\s+${name}\\s+from\\s+['"](?:\\.\\./)+molecules/${name}/index['"];?`, 'g'),
      new RegExp(`import\\s+\\{\\s*${name}\\s*\\}\\s+from\\s+['"](?:\\.\\./)+molecules['"];?`, 'g'),
      new RegExp(`from\\s+['"](?:\\.\\./)+molecules/${name}['"]`, 'g'),
      new RegExp(`from\\s+['"](?:\\.\\./)+molecules/${name}/index['"]`, 'g'),
    ];
    const replacement = `from '@/${['molecules', moleculePath].join('/')}'`;
    for (const pattern of patterns) {
      const next = result.replace(pattern, (m) => {
        if (m.startsWith('import ')) {
          modified = true;
          return `import ${name} from '@/${['molecules', moleculePath].join('/')}'`;
        }
        modified = true;
        return replacement;
      });
      result = next;
    }
  }

  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"](?:\.\.\/)+molecules\/(\w+)['"];?/g;
  result = result.replace(defaultImportRegex, (match, localName, componentName) => {
    const moleculePath = BARREL_EXPORTS[componentName];
    if (!moleculePath) {
      return match;
    }
    modified = true;
    return `import ${localName} from '@/${['molecules', moleculePath].join('/')}'`;
  });

  return { content: result, modified };
};

const walk = (dir) => {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts'].includes(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      n += walk(full);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (!content.includes('molecules')) {
        continue;
      }
      const { content: fixed, modified } = fixContent(content);
      if (modified) {
        fs.writeFileSync(full, fixed.replace(/\n{3,}/g, '\n\n'));
        n += 1;
      }
    }
  }
  return n;
};

console.log(`Updated ${walk(APP_ROOT)} files`);
