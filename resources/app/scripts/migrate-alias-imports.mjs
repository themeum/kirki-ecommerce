import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const STYLE_EXTENSIONS = ['.scss', '.css', '.sass'];
const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx)$/;

const isStyleSpecifier = (spec) => STYLE_EXTENSIONS.some((ext) => spec.endsWith(ext));

const resolveImport = (fromFile, spec) => {
  const fromDir = path.dirname(fromFile);
  const absBase = path.resolve(fromDir, spec);

  if (fs.existsSync(absBase) && fs.statSync(absBase).isFile()) {
    return absBase;
  }

  for (const ext of EXTENSIONS) {
    const candidate = absBase + ext;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (fs.existsSync(absBase) && fs.statSync(absBase).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexPath = path.join(absBase, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  }

  for (const ext of EXTENSIONS) {
    const indexPath = path.join(absBase, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
};

const toAliasPath = (resolvedPath) => {
  const rel = path.relative(APP_ROOT, resolvedPath).replace(/\\/g, '/');
  const withoutExt = rel.replace(/\.(tsx|ts|jsx|js)$/, '');
  return `@/${withoutExt}`;
};

const transformContent = (filePath, content) => {
  let changed = false;
  const unresolvable = [];

  const convertSpecifier = (spec) => {
    if (isStyleSpecifier(spec)) {
      return null;
    }

    const resolved = resolveImport(filePath, spec);
    if (!resolved) {
      unresolvable.push({ file: filePath, spec });
      return null;
    }

    changed = true;
    return toAliasPath(resolved);
  };

  const replaceFromImports = (input) =>
    input.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g, (match, _quote, spec) => {
      const alias = convertSpecifier(spec);
      if (!alias) {
        return match;
      }
      return `from '${alias}'`;
    });

  const replaceDynamicImports = (input) =>
    input.replace(/import\s*\(\s*(['"])(\.\.?\/[^'"]+)\1\s*\)/g, (match, _quote, spec) => {
      const alias = convertSpecifier(spec);
      if (!alias) {
        return match;
      }
      return `import('${alias}')`;
    });

  const replaceSideEffectImports = (input) =>
    input.replace(/import\s+(['"])(\.\.?\/[^'"]+)\1\s*;/g, (match, _quote, spec) => {
      if (isStyleSpecifier(spec)) {
        return match;
      }

      const alias = convertSpecifier(spec);
      if (!alias) {
        return match;
      }
      return `import '${alias}';`;
    });

  let result = content;
  result = replaceFromImports(result);
  result = replaceDynamicImports(result);
  result = replaceSideEffectImports(result);

  return { content: result, changed, unresolvable };
};

const walk = (dir) => {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'scripts' || entry.name === '.vite') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

const files = walk(APP_ROOT);
let changedCount = 0;
const allUnresolvable = [];

for (const filePath of files) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { content, changed, unresolvable } = transformContent(filePath, original);

  if (unresolvable.length > 0) {
    allUnresolvable.push(...unresolvable);
  }

  if (changed && content !== original) {
    fs.writeFileSync(filePath, content);
    changedCount++;
  }
}

console.log(`Scanned ${files.length} files`);
console.log(`Changed ${changedCount} files`);

if (allUnresolvable.length > 0) {
  console.log(`\nUnresolvable imports (${allUnresolvable.length}):`);
  for (const item of allUnresolvable) {
    const rel = path.relative(APP_ROOT, item.file);
    console.log(`  ${rel}: ${item.spec}`);
  }
}
