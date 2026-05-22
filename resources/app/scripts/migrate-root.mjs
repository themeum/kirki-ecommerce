import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const moves = [
  ['floatingComponents/UnsavedTracker.jsx', 'floating-components/unsaved-tracker.jsx'],
  ['floatingComponents/ToastController.jsx', 'floating-components/toast-controller.jsx'],
  ['Init/index.js', 'init/init.jsx'],
  ['Icons/index.jsx', 'icons.jsx'],
  ['Tryouts.jsx', 'tryouts.jsx'],
];

const rmrf = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e);
    fs.statSync(f).isDirectory() ? rmrf(f) : fs.unlinkSync(f);
  }
  fs.rmdirSync(dir);
};

for (const [from, to] of moves) {
  const src = path.join(ROOT, from);
  const dest = path.join(ROOT, to);
  if (fs.existsSync(dest)) continue;
  if (!fs.existsSync(src)) {
    console.warn('skip', from);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

rmrf(path.join(ROOT, 'floatingComponents'));
rmrf(path.join(ROOT, 'Init'));
rmrf(path.join(ROOT, 'Icons'));
if (fs.existsSync(path.join(ROOT, 'Tryouts.jsx'))) fs.unlinkSync(path.join(ROOT, 'Tryouts.jsx'));

const previewDir = path.join(ROOT, 'PreviewPages');
const previewNew = path.join(ROOT, 'preview-pages');
if (fs.existsSync(previewDir)) {
  fs.mkdirSync(previewNew, { recursive: true });
  for (const f of fs.readdirSync(previewDir)) {
    if (!/\.jsx$/.test(f)) continue;
    const kebab = f.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\.jsx$/, '.jsx').toLowerCase();
    fs.copyFileSync(path.join(previewDir, f), path.join(previewNew, kebab));
  }
  rmrf(previewDir);
}

const replaceAll = (content) => {
  let r = content;
  const pairs = [
    ['@/floatingComponents/UnsavedTracker', '@/floating-components/unsaved-tracker'],
    ['@/floatingComponents/ToastController', '@/floating-components/toast-controller'],
    ['../floatingComponents/UnsavedTracker', '@/floating-components/unsaved-tracker'],
    ['../floatingComponents/ToastController', '@/floating-components/toast-controller'],
    ['@/Init', '@/init/init'],
    ['@/Icons', '@/icons'],
    ['@/Tryouts', '@/tryouts'],
    ['@/PreviewPages/', '@/preview-pages/'],
    ['../PreviewPages/', '@/preview-pages/'],
    ['../components/Modal/ConfirmationModal', '@/components/modal/confirmation-modal'],
    ['../components/Toast', '@/components/toast'],
    ['../components/Toast/index', '@/components/toast'],
    ['@/pages/settings/utils', '@/pages/settings/utils'],
    ['from "../Pages/Settings/utils"', "from '@/pages/settings/utils'"],
    ['from "../../Pages/Settings/utils"', "from '@/pages/settings/utils'"],
  ];
  for (const [a, b] of pairs) {
    r = r.split(a).join(b);
  }
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
      const fixed = replaceAll(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

console.log('Root migrate done, updated', walk(ROOT), 'files');
