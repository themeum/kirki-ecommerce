import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const fix = (content) => {
  let r = content;
  const barrelRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/components['"];?/gs;
  r = r.replace(barrelRegex, (match, block) => {
    return block.split(',').map((s) => s.trim()).filter(Boolean).map((name) => {
      const parts = name.split(/\s+as\s+/);
      const exportName = parts[0].trim();
      const local = (parts[1] || parts[0]).trim();
      const dest = COMPONENT_MAP[exportName];
      return dest ? `import ${local} from '@/components/${dest}';` : match;
    }).join('\n');
  });

  const relBarrel = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+components['"];?/gs;
  r = r.replace(relBarrel, (match, block) => {
    return block.split(',').map((s) => s.trim()).filter(Boolean).map((name) => {
      const parts = name.split(/\s+as\s+/);
      const exportName = parts[0].trim();
      const local = (parts[1] || parts[0]).trim();
      const dest = COMPONENT_MAP[exportName];
      return dest ? `import ${local} from '@/components/${dest}';` : match;
    }).join('\n');
  });

  for (const [name, dest] of Object.entries(COMPONENT_MAP)) {
    r = r.replace(
      new RegExp(`from ['"](?:\\.\\./)+components/${name}['"]`, 'g'),
      `from '@/components/${dest}'`,
    );
    r = r.replace(
      new RegExp(`from ['"]@/components/${name}['"]`, 'g'),
      `from '@/components/${dest}'`,
    );
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
      if (!c.includes('components')) continue;
      const fixed = fix(c);
      if (fixed !== c) {
        fs.writeFileSync(f, fixed);
        n++;
      }
    }
  }
  return n;
};

console.log('Fixed', walk(APP_ROOT), 'files');
