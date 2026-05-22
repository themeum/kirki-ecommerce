import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOLECULES = path.join(__dirname, '../molecules');
const STAGING = path.join(__dirname, '../molecules.__staging__');
const APP_ROOT = path.join(__dirname, '..');

const toKebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

export const BARREL_EXPORTS = {
  Button: 'button',
  Label: 'label',
  Input: 'input',
  Select: 'select',
  Checkbox: 'checkbox',
  Badge: 'badge',
  Separator: 'separator',
  Heading: 'heading',
  PageHeading: 'page-heading',
  Card: 'card',
  Container: 'container',
  Grid: 'grid',
  Text: 'text',
  RichText: 'rich-text',
  Tab: 'tab',
  TagManager: 'tag-manager',
  Tag: 'tag',
  SuggestionDropdown: 'suggestion-dropdown',
  Flex: 'flex',
  RadioGroup: 'radio-group',
  ToggleButton: 'toggle-button',
  ActionGroup: 'action-group',
  Tooltip: 'tooltip',
  Thumbnail: 'thumbnail',
  Placeholder: 'placeholder',
  Alert: 'alert',
  SelectInput: 'select-input',
  Searchbox: 'searchbox',
  ColorPicker: 'color-picker',
  FullPageContainer: 'full-page-container',
  Capsule: 'capsule',
  Progressbar: 'progressbar',
  Table: 'table/table',
  TableHeader: 'table/table-header',
  TableBody: 'table/table-body',
  TableCell: 'table/table-cell',
  TableHead: 'table/table-head',
  TableRow: 'table/table-row',
  Dropdown: 'dropdown/dropdown',
  DropdownTrigger: 'dropdown/dropdown-trigger',
  DropdownMenuContent: 'dropdown/dropdown-menu-content',
  DropdownMenuItem: 'dropdown/dropdown-menu-item',
  DropdownMenuShortcut: 'dropdown/dropdown-menu-shortcut',
  Accordion: 'accordion/accordion',
  AccordionItem: 'accordion/accordion-item',
  AccordionTrigger: 'accordion/accordion-trigger',
  AccordionContent: 'accordion/accordion-content',
  Popover: 'popover/popover',
  PopoverHeader: 'popover/popover-header',
  PopoverBody: 'popover/popover-body',
  PopoverFooter: 'popover/popover-footer',
  PopoverTitle: 'popover/popover-title',
  PopoverDescription: 'popover/popover-description',
  SelectDropdown: 'select/select-dropdown',
  RadioItem: 'radio-group/radio-item',
  SelectedTags: 'tag-manager/selected-tags',
};

const SOURCE_MAP = [
  ['ActionGroup/index.jsx', 'action-group.jsx'],
  ['Alert/index.jsx', 'alert.jsx'],
  ['Badge/index.jsx', 'badge.jsx'],
  ['Button/index.jsx', 'button.jsx'],
  ['Capsule/index.jsx', 'capsule.jsx'],
  ['Card/index.jsx', 'card.jsx'],
  ['Checkbox/index.jsx', 'checkbox.jsx'],
  ['ColorPicker/index.jsx', 'color-picker.jsx'],
  ['Container/index.jsx', 'container.jsx'],
  ['Flex/index.js', 'flex.jsx'],
  ['FullPageContainer/index.jsx', 'full-page-container.jsx'],
  ['Grid/index.jsx', 'grid.jsx'],
  ['Heading/index.jsx', 'heading.jsx'],
  ['Input/index.jsx', 'input.jsx'],
  ['Label/index.jsx', 'label.jsx'],
  ['PageHeading/index.jsx', 'page-heading.jsx'],
  ['Placeholder/index.jsx', 'placeholder.jsx'],
  ['Progressbar/index.jsx', 'progressbar.jsx'],
  ['RichText/index.js', 'rich-text.jsx'],
  ['Searchbox/index.jsx', 'searchbox.jsx'],
  ['SelectInput/index.jsx', 'select-input.jsx'],
  ['Separator/index.jsx', 'separator.jsx'],
  ['SuggestionDropdown/index.jsx', 'suggestion-dropdown.jsx'],
  ['Tab/index.jsx', 'tab.jsx'],
  ['Tag/index.jsx', 'tag.jsx'],
  ['Text/index.jsx', 'text.jsx'],
  ['Thumbnail/index.jsx', 'thumbnail.jsx'],
  ['ToggleButton/index.jsx', 'toggle-button.jsx'],
  ['Tooltip/index.jsx', 'tooltip.jsx'],
  ['Accordion/Accordion.jsx', 'accordion/accordion.jsx'],
  ['Accordion/AccordionContent.jsx', 'accordion/accordion-content.jsx'],
  ['Accordion/AccordionItem.jsx', 'accordion/accordion-item.jsx'],
  ['Accordion/AccordionTrigger.jsx', 'accordion/accordion-trigger.jsx'],
  ['Dropdown/Dropdown.jsx', 'dropdown/dropdown.jsx'],
  ['Dropdown/DropdownMenuContent.jsx', 'dropdown/dropdown-menu-content.jsx'],
  ['Dropdown/DropdownMenuItem.jsx', 'dropdown/dropdown-menu-item.jsx'],
  ['Dropdown/DropdownMenuShortcut.jsx', 'dropdown/dropdown-menu-shortcut.jsx'],
  ['Dropdown/DropdownTrigger.jsx', 'dropdown/dropdown-trigger.jsx'],
  ['Popover/Popover.jsx', 'popover/popover.jsx'],
  ['Popover/PopoverBody.jsx', 'popover/popover-body.jsx'],
  ['Popover/PopoverDescription.jsx', 'popover/popover-description.jsx'],
  ['Popover/PopoverFooter.jsx', 'popover/popover-footer.jsx'],
  ['Popover/PopoverHeader.jsx', 'popover/popover-header.jsx'],
  ['Popover/PopoverTitle.jsx', 'popover/popover-title.jsx'],
  ['Select/index.jsx', 'select/select.jsx'],
  ['Select/SelectDropdown.jsx', 'select/select-dropdown.jsx'],
  ['RadioGroup/index.jsx', 'radio-group/radio-group.jsx'],
  ['RadioGroup/RadioItem.jsx', 'radio-group/radio-item.jsx'],
  ['TagManager/index.jsx', 'tag-manager/tag-manager.jsx'],
  ['TagManager/SelectedTags.jsx', 'tag-manager/selected-tags.jsx'],
  ['table/Table.jsx', 'table/table.jsx'],
  ['table/TableBody.jsx', 'table/table-body.jsx'],
  ['table/TableCell.jsx', 'table/table-cell.jsx'],
  ['table/TableHead.jsx', 'table/table-head.jsx'],
  ['table/TableHeader.jsx', 'table/table-header.jsx'],
  ['table/TableRow.jsx', 'table/table-row.jsx'],
];

const rmrf = (dir) => {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      rmrf(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(dir);
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const copyToStaging = () => {
  rmrf(STAGING);
  ensureDir(STAGING);

  for (const [srcRel, destRel] of SOURCE_MAP) {
    const srcFlat = path.join(MOLECULES, destRel);
    const srcPascal = path.join(MOLECULES, srcRel);
    const src = fs.existsSync(srcPascal) ? srcPascal : fs.existsSync(srcFlat) ? srcFlat : null;
    if (!src) {
      console.warn(`SKIP missing: ${srcRel}`);
      continue;
    }
    const dest = path.join(STAGING, destRel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
};

const replaceMolecules = () => {
  for (const entry of fs.readdirSync(MOLECULES)) {
    if (entry === 'molecules.__staging__' || entry.startsWith('.')) {
      continue;
    }
    const full = path.join(MOLECULES, entry);
    if (fs.statSync(full).isDirectory()) {
      rmrf(full);
    } else if (/\.(jsx|js)$/.test(entry)) {
      fs.unlinkSync(full);
    }
  }

  const copyTree = (srcDir, destDir) => {
    ensureDir(destDir);
    for (const entry of fs.readdirSync(srcDir)) {
      const src = path.join(srcDir, entry);
      const dest = path.join(destDir, entry);
      if (fs.statSync(src).isDirectory()) {
        copyTree(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  };

  copyTree(STAGING, MOLECULES);
  rmrf(STAGING);
};

const RELATIVE_IMPORT_MAP = [
  ['./Button', '@/molecules/button'],
  ['./Label', '@/molecules/label'],
  ['./Input', '@/molecules/input'],
  ['./Select', '@/molecules/select/select'],
  ['./Checkbox', '@/molecules/checkbox'],
  ['./Dropdown', '@/molecules/dropdown/dropdown'],
  ['./DropdownTrigger', '@/molecules/dropdown/dropdown-trigger'],
  ['./DropdownMenuContent', '@/molecules/dropdown/dropdown-menu-content'],
  ['./DropdownMenuItem', '@/molecules/dropdown/dropdown-menu-item'],
  ['./DropdownMenuShortcut', '@/molecules/dropdown/dropdown-menu-shortcut'],
  ['./Accordion', '@/molecules/accordion/accordion'],
  ['./AccordionItem', '@/molecules/accordion/accordion-item'],
  ['./AccordionTrigger', '@/molecules/accordion/accordion-trigger'],
  ['./AccordionContent', '@/molecules/accordion/accordion-content'],
  ['./Popover', '@/molecules/popover/popover'],
  ['./PopoverHeader', '@/molecules/popover/popover-header'],
  ['./PopoverBody', '@/molecules/popover/popover-body'],
  ['./PopoverFooter', '@/molecules/popover/popover-footer'],
  ['./PopoverTitle', '@/molecules/popover/popover-title'],
  ['./PopoverDescription', '@/molecules/popover/popover-description'],
  ['./Table', '@/molecules/table/table'],
  ['./TableHeader', '@/molecules/table/table-header'],
  ['./TableBody', '@/molecules/table/table-body'],
  ['./TableCell', '@/molecules/table/table-cell'],
  ['./TableHead', '@/molecules/table/table-head'],
  ['./TableRow', '@/molecules/table/table-row'],
  ['./SelectDropdown', '@/molecules/select/select-dropdown'],
  ['./RadioItem', '@/molecules/radio-group/radio-item'],
  ['./SelectedTags', '@/molecules/tag-manager/selected-tags'],
  ['./TagManager', '@/molecules/tag-manager/tag-manager'],
  ['./RadioGroup', '@/molecules/radio-group/radio-group'],
  ['./Heading', '@/molecules/heading'],
  ['./Text', '@/molecules/text'],
  ['./Container', '@/molecules/container'],
  ['./Card', '@/molecules/card'],
  ['./Badge', '@/molecules/badge'],
  ['./Button', '@/molecules/button'],
];

const fixMoleculeRelativeImports = (content) => {
  let result = content;
  for (const [rel, alias] of RELATIVE_IMPORT_MAP) {
    const patterns = [
      new RegExp(`from ['"]${rel.replace('.', '\\.')}['"]`, 'g'),
      new RegExp(`from ['"]${rel.replace('.', '\\.')}\\/index['"]`, 'g'),
    ];
    for (const pattern of patterns) {
      result = result.replace(pattern, `from '${alias}'`);
    }
  }
  return result;
};

const fixBarrelImportsInFile = (content) => {
  const lines = content.split('\n');
  const out = [];
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const single = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"]@\/molecules['"];?\s*$/);
    if (single) {
      const names = single[1].split(',').map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        const parts = name.split(/\s+as\s+/);
        const exportName = parts[0].trim();
        const localName = (parts[1] || parts[0]).trim();
        const moleculePath = BARREL_EXPORTS[exportName];
        if (moleculePath) {
          out.push(`import ${localName} from '@/${['molecules', moleculePath].join('/')}';`);
        } else {
          out.push(line);
        }
      }
      modified = true;
      continue;
    }

    if (line.match(/^import\s+\{/) && line.includes('@/molecules')) {
      let block = line;
      while (!block.includes('}') && i + 1 < lines.length) {
        i += 1;
        block += `\n${lines[i]}`;
      }
      const multi = block.match(/import\s+\{([^}]+)\}\s+from\s+['"]@\/molecules['"];?/s);
      if (multi) {
        const names = multi[1].split(',').map((s) => s.trim()).filter(Boolean);
        for (const name of names) {
          const parts = name.split(/\s+as\s+/);
          const exportName = parts[0].trim();
          const localName = (parts[1] || parts[0]).trim();
          const moleculePath = BARREL_EXPORTS[exportName];
          if (moleculePath) {
            out.push(`import ${localName} from '@/${['molecules', moleculePath].join('/')}';`);
          }
        }
        modified = true;
        continue;
      }
    }

    out.push(line);
  }

  return { content: out.join('\n'), modified };
};

const walkFiles = (dir, cb) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'scripts' || entry.name === 'molecules.__staging__') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, cb);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      cb(full);
    }
  }
};

copyToStaging();
replaceMolecules();

walkFiles(MOLECULES, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixMoleculeRelativeImports(content);
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed);
  }
});

walkFiles(APP_ROOT, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('@/molecules')) {
    return;
  }
  const { content: newContent, modified } = fixBarrelImportsInFile(content);
  const fixed = fixMoleculeRelativeImports(newContent);
  if (modified || fixed !== content) {
    fs.writeFileSync(filePath, fixed);
  }
});

console.log('Molecules migration complete');
