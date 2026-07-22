import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..');

const DEFAULT_EXPORTS = [
  'flex',
  'text',
  'action-group',
  'page-heading',
  'container',
  'grid',
  'badge',
  'thumbnail',
  'toggle-button',
  'progressbar',
  'tag',
  'placeholder',
  'tooltip',
  'heading',
  'full-page-container',
  'alert',
  'checkbox',
  'label',
];

const NAMED_ONLY = {
  table: '@/components/ui/table',
  accordion: '@/components/ui/accordion',
};

const DEFAULT_TO_NAMED = {
  card: { path: '@/components/ui/card', name: 'Card' },
  separator: { path: '@/components/ui/separator', name: 'Separator' },
};

const SKIP_DIRS = new Set(['node_modules', 'scripts', 'molecules']);

const walk = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const rewriteFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('@/molecules/')) {
    return false;
  }

  let modified = false;
  let next = content;

  for (const name of DEFAULT_EXPORTS) {
    const pattern = new RegExp(
      `from\\s+(['"])@/molecules/${name}\\1`,
      'g',
    );
    const replaced = next.replace(
      pattern,
      `from $1@/components/ui/${name}$1`,
    );
    if (replaced !== next) {
      modified = true;
      next = replaced;
    }
  }

  for (const [name, target] of Object.entries(NAMED_ONLY)) {
    const pattern = new RegExp(
      `from\\s+(['"])@/molecules/${name}\\1`,
      'g',
    );
    const replaced = next.replace(pattern, `from $1${target}$1`);
    if (replaced !== next) {
      modified = true;
      next = replaced;
    }
  }

  for (const [name, meta] of Object.entries(DEFAULT_TO_NAMED)) {
    const defaultImport = new RegExp(
      `import\\s+(\\w+)\\s+from\\s+(['"])@/molecules/${name}\\2;?`,
      'g',
    );
    next = next.replace(defaultImport, (match, localName, quote) => {
      modified = true;
      if (localName === meta.name) {
        return `import { ${meta.name} } from ${quote}${meta.path}${quote};`;
      }
      return `import { ${meta.name} as ${localName} } from ${quote}${meta.path}${quote};`;
    });

    const namedImport = new RegExp(
      `from\\s+(['"])@/molecules/${name}\\1`,
      'g',
    );
    const replacedNamed = next.replace(
      namedImport,
      `from $1${meta.path}$1`,
    );
    if (replacedNamed !== next) {
      modified = true;
      next = replacedNamed;
    }
  }

  const radioPattern = /from\s+(['"])@\/molecules\/radio-group\1/g;
  if (radioPattern.test(next)) {
    next = next.replace(
      radioPattern,
      `from $1@/components/ui/radio-group$1`,
    );
    modified = true;
  }

  if (!modified) {
    return false;
  }

  fs.writeFileSync(filePath, next);
  return true;
};

const files = walk(APP_ROOT);
let updated = 0;
for (const file of files) {
  if (rewriteFile(file)) {
    updated += 1;
    console.log(path.relative(APP_ROOT, file));
  }
}

console.log(`Updated ${updated} files`);
