import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENTS = path.join(__dirname, '../components');
const STAGING = path.join(__dirname, '../components.__staging__');
const APP_ROOT = path.join(__dirname, '..');

const COMPONENT_MAP = {
  BulkActionHandler: 'bulk-action-handler',
  CountrySelector: 'country-selector',
  DropdownButton: 'dropdown-button',
  GroupOptionCard: 'group-option-card',
  GroupSelect: 'group-select',
  GroupTagTable: 'group-tag-table',
  HeaderActionsCard: 'header-actions-card',
  LoadingSpinner: 'loading-spinner',
  MediaGallery: 'media-gallery',
  MediaSelector: 'media-selector',
  MediaStack: 'media-stack',
  ConfirmationModal: 'modal/confirmation-modal',
  OptionAccordion: 'option-accordion',
  PageNavbar: 'page-navbar',
  Pagination: 'pagination',
  Sorting: 'sorting',
  ThumbnailSelector: 'thumbnail-selector',
  Toast: 'toast',
};

const SOURCE_MAP = [
  ['BulkActionHandler/index.js', 'bulk-action-handler.jsx'],
  ['CountrySelector.js', 'country-selector.jsx'],
  ['DropdownButton.js', 'dropdown-button.jsx'],
  ['GroupOptionCard.js', 'group-option-card.jsx'],
  ['GroupSelect/index.js', 'group-select.jsx'],
  ['GroupTagTable/index.js', 'group-tag-table.jsx'],
  ['HeaderActionsCard.js', 'header-actions-card.jsx'],
  ['LoadingSpinner.jsx', 'loading-spinner.jsx'],
  ['MediaGallery/index.jsx', 'media-gallery.jsx'],
  ['MediaSelector.js', 'media-selector.jsx'],
  ['MediaStack/index.js', 'media-stack.jsx'],
  ['Modal/ConfirmationModal.js', 'modal/confirmation-modal.jsx'],
  ['OptionAccordion.js', 'option-accordion.jsx'],
  ['PageNavbar.js', 'page-navbar.jsx'],
  ['Pagination/index.js', 'pagination.jsx'],
  ['Sorting.js', 'sorting.jsx'],
  ['ThumbnailSelector/index.js', 'thumbnail-selector.jsx'],
  ['Toast/index.js', 'toast.jsx'],
];

const rmrf = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir)) {
    const f = path.join(dir, e);
    fs.statSync(f).isDirectory() ? rmrf(f) : fs.unlinkSync(f);
  }
  fs.rmdirSync(dir);
};

const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });

rmrf(STAGING);
ensureDir(STAGING);

for (const [srcRel, destRel] of SOURCE_MAP) {
  const src = path.join(COMPONENTS, srcRel);
  if (!fs.existsSync(src)) {
    console.warn('SKIP', srcRel);
    continue;
  }
  const dest = path.join(STAGING, destRel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

rmrf(COMPONENTS);
ensureDir(COMPONENTS);

const copyTree = (s, d) => {
  ensureDir(d);
  for (const e of fs.readdirSync(s)) {
    const sf = path.join(s, e);
    const df = path.join(d, e);
    fs.statSync(sf).isDirectory() ? copyTree(sf, df) : fs.copyFileSync(sf, df);
  }
};
copyTree(STAGING, COMPONENTS);
rmrf(STAGING);

if (fs.existsSync(path.join(COMPONENTS, 'index.js'))) {
  fs.unlinkSync(path.join(COMPONENTS, 'index.js'));
}

const fixImports = (content) => {
  let r = content;
  for (const [name, dest] of Object.entries(COMPONENT_MAP)) {
    const patterns = [
      [`@/components/${name}`, `@/components/${dest}`],
      [`@/components/${name}/index`, `@/components/${dest}`],
      [`from "./${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from './${name}'`, `from '@/${['components', dest].join('/')}'`],
      [`from "./${name}/index"`, `from '@/${['components', dest].join('/')}'`],
      [`from './${name}/index'`, `from '@/${['components', dest].join('/')}'`],
      [`from "../components/${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from '../../components/${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from "../../../components/${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from '../../../../components/${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from "../../components/${name}"`, `from '@/${['components', dest].join('/')}'`],
      [`from '../../../components/${name}'`, `from '@/${['components', dest].join('/')}'`],
    ];
    for (const [from, to] of patterns) {
      r = r.split(from).join(to);
    }
  }

  const barrelRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/components['"];?/gs;
  r = r.replace(barrelRegex, (match, block) => {
    return block.split(',').map((s) => s.trim()).filter(Boolean).map((name) => {
      const parts = name.split(/\s+as\s+/);
      const exportName = parts[0].trim();
      const local = (parts[1] || parts[0]).trim();
      const dest = COMPONENT_MAP[exportName];
      return dest ? `import ${local} from '@/${['components', dest].join('/')}';` : match;
    }).join('\n');
  });

  return r;
};

const walk = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts'].includes(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) n += walk(f);
    else if (/\.(jsx|js)$/.test(e.name)) {
      const c = fs.readFileSync(f, 'utf8');
      const fixed = fixImports(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

console.log(`Updated imports in ${walk(APP_ROOT)} files`);
