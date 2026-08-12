// Generic file-move codemod for the features/ restructure. Given a JSON
// manifest of { from, to } paths (relative to resources/app/, files or
// directories), it `git mv`s each entry and then rewrites every import
// specifier in the app that pointed at a moved path:
//
//   - '@/...' specifiers are repointed to the new '@/...' location.
//   - relative ('./', '../') specifiers are recomputed against the new
//     location, whether the importer moved, the target moved, or both.
//
// Only import/export-from specifiers and dynamic import() calls are
// touched — never the statements around them. Anything it cannot resolve
// to a real file is reported, not guessed.
//
// Usage: node scripts/migrate-feature.mjs <manifest.json>
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.vite']);
const CODE_EXT_RE = /\.(ts|tsx)$/;
const IMPORT_RE = /\b(?:from\s+|import\s*\(|import\s+)(['"])((?:[^'"\\]|\\.)*)\1/g;

const stripExt = (p) => p.replace(CODE_EXT_RE, '');
const toPosix = (p) => p.split(path.sep).join('/');

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name) || entry.name === '.DS_Store') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function expandManifest(manifest) {
  const entries = [];
  for (const { from, to } of manifest) {
    const fromAbs = path.join(APP_ROOT, from);
    if (fs.existsSync(fromAbs) && fs.statSync(fromAbs).isDirectory()) {
      for (const fileAbs of listFiles(fromAbs)) {
        const rel = toPosix(path.relative(fromAbs, fileAbs));
        entries.push({ from: `${from}/${rel}`, to: `${to}/${rel}` });
      }
    } else {
      entries.push({ from, to });
    }
  }
  return entries;
}

// `movedByOldAbs` is consulted before the filesystem: by the time imports
// are scanned, every moved file has already been `git mv`'d away from its
// old path, so an fs-only lookup can never resolve a specifier pointing at
// something that moved in this same batch.
function resolveSpecifier(baseDir, spec, movedByOldAbs) {
  const base = spec.startsWith('@/') ? path.join(APP_ROOT, spec.slice(2)) : path.resolve(baseDir, spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  for (const candidate of candidates) {
    if (movedByOldAbs.has(candidate)) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function toAliasSpecifier(targetAbs) {
  const target = CODE_EXT_RE.test(targetAbs) ? stripExt(targetAbs) : targetAbs;
  return `@/${toPosix(path.relative(APP_ROOT, target))}`;
}

function toRelativeSpecifier(fromFileAbs, targetAbs) {
  const target = CODE_EXT_RE.test(targetAbs) ? stripExt(targetAbs) : targetAbs;
  let rel = toPosix(path.relative(path.dirname(fromFileAbs), target));
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error('Usage: node scripts/migrate-feature.mjs <manifest.json>');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = expandManifest(manifest);

  if (entries.length === 0) {
    console.error('Manifest resolved to zero files.');
    process.exit(1);
  }

  // Reverse-lookup: new absolute path -> { oldAbs, newAbs }, keyed for both
  // "did this file move" and "resolve the old dir a moved file's relative
  // imports were originally written against".
  const movedByOldAbs = new Map();
  const movedByNewAbs = new Map();
  for (const { from, to } of entries) {
    const oldAbs = path.join(APP_ROOT, from);
    const newAbs = path.join(APP_ROOT, to);
    const record = { oldAbs, newAbs };
    movedByOldAbs.set(oldAbs, record);
    movedByNewAbs.set(newAbs, record);
  }

  for (const { from, to } of entries) {
    const toAbs = path.join(APP_ROOT, to);
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    execSync(`git mv ${JSON.stringify(from)} ${JSON.stringify(to)}`, { cwd: APP_ROOT, stdio: 'pipe' });
  }
  console.log(`Moved ${entries.length} file(s).`);

  // git doesn't track directories, so emptying one via git mv leaves it
  // behind on disk. Prune every source directory left empty by the move.
  const sourceDirs = [...new Set(entries.map(({ from }) => path.dirname(path.join(APP_ROOT, from))))]
    .sort((a, b) => b.length - a.length);
  for (const dir of sourceDirs) {
    let current = dir;
    while (current.startsWith(APP_ROOT) && current !== APP_ROOT) {
      if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) {
        break;
      }
      fs.rmdirSync(current);
      current = path.dirname(current);
    }
  }

  const unresolved = [];
  let filesChanged = 0;

  for (const fileAbs of listFiles(APP_ROOT)) {
    if (!/\.(ts|tsx)$/.test(fileAbs)) {
      continue;
    }

    const movedSelf = movedByNewAbs.get(fileAbs);
    const baseDirForRelative = movedSelf ? path.dirname(movedSelf.oldAbs) : path.dirname(fileAbs);

    const content = fs.readFileSync(fileAbs, 'utf8');
    let changed = false;

    const rewritten = content.replace(IMPORT_RE, (match, quote, spec) => {
      const isAlias = spec.startsWith('@/');
      const isRelative = spec.startsWith('.');
      if (!isAlias && !isRelative) {
        return match;
      }

      const targetAbs = resolveSpecifier(isAlias ? APP_ROOT : baseDirForRelative, spec, movedByOldAbs);
      if (!targetAbs) {
        unresolved.push({ file: path.relative(APP_ROOT, fileAbs), spec });
        return match;
      }

      const movedTarget = movedByOldAbs.get(targetAbs);
      const finalTargetAbs = movedTarget ? movedTarget.newAbs : targetAbs;

      if (!movedTarget && !movedSelf) {
        return match;
      }

      const newSpec = isAlias ? toAliasSpecifier(finalTargetAbs) : toRelativeSpecifier(fileAbs, finalTargetAbs);
      if (newSpec === spec) {
        return match;
      }

      changed = true;
      return match.replace(`${quote}${spec}${quote}`, `${quote}${newSpec}${quote}`);
    });

    if (changed) {
      fs.writeFileSync(fileAbs, rewritten);
      filesChanged++;
    }
  }

  console.log(`Rewrote imports in ${filesChanged} file(s).`);

  if (unresolved.length > 0) {
    console.error(`\n${unresolved.length} unresolved specifier(s) — fix by hand:`);
    for (const { file, spec } of unresolved) {
      console.error(`  ${file}: ${spec}`);
    }
    process.exit(1);
  }
}

main();
