import fs from 'fs';
import path from 'path';

const APP = path.resolve('resources/app');

const FOLDERS = {
  accordion: {
    Accordion: 'accordion',
    AccordionItem: 'accordion-item',
    AccordionTrigger: 'accordion-trigger',
    AccordionContent: 'accordion-content',
    AccordionContext: 'accordion',
  },
  dropdown: {
    Dropdown: 'dropdown',
    DropdownTrigger: 'dropdown-trigger',
    DropdownMenuContent: 'dropdown-menu-content',
    DropdownMenuItem: 'dropdown-menu-item',
    DropdownMenuShortcut: 'dropdown-menu-shortcut',
  },
  popover: {
    Popover: 'popover',
    PopoverHeader: 'popover-header',
    PopoverBody: 'popover-body',
    PopoverFooter: 'popover-footer',
    PopoverTitle: 'popover-title',
    PopoverDescription: 'popover-description',
  },
  select: {
    Select: 'select',
    SelectDropdown: 'select-dropdown',
  },
  table: {
    Table: 'table',
    TableBody: 'table-body',
    TableCell: 'table-cell',
    TableHead: 'table-head',
    TableHeader: 'table-header',
    TableRow: 'table-row',
  },
  'radio-group': {
    RadioGroup: 'radio-group',
    RadioItem: 'radio-item',
  },
  'tag-manager': {
    TagManager: 'tag-manager',
    SelectedTags: 'selected-tags',
  },
};

const fileToName = (folder, fileStem) => {
  const map = FOLDERS[folder];
  for (const [name, stem] of Object.entries(map)) {
    if (stem === fileStem) {
      return name;
    }
  }
  return null;
};

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'scripts') {
        continue;
      }
      walk(full, files);
      continue;
    }
    if (/\.(jsx?|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(APP, filePath).replace(/\\/g, '/');
  const inMoleculeFolder = /^molecules\/(accordion|dropdown|popover|select|table|radio-group|tag-manager)\//.test(
    rel,
  );

  const importsByFolder = {};

  for (const folder of Object.keys(FOLDERS)) {
    const defaultRe = new RegExp(
      `^import\\s+(\\w+)\\s+from\\s+['"]@/molecules/${folder}/([\\w-]+)['"];?`,
      'gm',
    );
    const namedRe = new RegExp(
      `^import\\s+\\{([^}]+)\\}\\s+from\\s+['"]@/molecules/${folder}/([\\w-]+)['"];?`,
      'gm',
    );

    content = content.replace(defaultRe, (match, localName, fileStem) => {
      if (inMoleculeFolder && rel.startsWith(`molecules/${folder}/`)) {
        return match;
      }
      const exportName = fileToName(folder, fileStem);
      if (!exportName) {
        return match;
      }
      if (!importsByFolder[folder]) {
        importsByFolder[folder] = new Set();
      }
      importsByFolder[folder].add(exportName);
      return '';
    });

    content = content.replace(namedRe, (match, namesBlock, fileStem) => {
      if (inMoleculeFolder && rel.startsWith(`molecules/${folder}/`)) {
        return match;
      }
      const exportName = fileToName(folder, fileStem);
      if (!exportName) {
        return match;
      }
      if (!importsByFolder[folder]) {
        importsByFolder[folder] = new Set();
      }
      for (const part of namesBlock.split(',')) {
        const trimmed = part.trim();
        if (!trimmed) {
          continue;
        }
        const exportPart = trimmed.split(/\s+as\s+/)[0].trim();
        importsByFolder[folder].add(exportPart);
      }
      return '';
    });
  }

  if (Object.keys(importsByFolder).length === 0) {
    return false;
  }

  const barrelLines = Object.entries(importsByFolder)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, names]) => {
      const sorted = [...names].sort();
      return `import { ${sorted.join(', ')} } from '@/molecules/${folder}';`;
    });

  const importBlockRe = /^(import\s+.+?;\s*\n)+/m;
  const match = content.match(importBlockRe);
  if (match) {
    const existing = match[0].trimEnd();
    const merged = `${existing}\n${barrelLines.join('\n')}\n`;
    content = content.replace(importBlockRe, `${merged}\n`);
  } else {
    content = `${barrelLines.join('\n')}\n\n${content}`;
  }

  content = content.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(filePath, content);
  return true;
};

let changed = 0;
for (const file of walk(APP)) {
  if (file.includes('/molecules/') && file.endsWith('/index.js')) {
    continue;
  }
  if (fixFile(file)) {
    changed += 1;
    console.log('fixed', path.relative(APP, file));
  }
}

console.log(`Updated ${changed} files`);
