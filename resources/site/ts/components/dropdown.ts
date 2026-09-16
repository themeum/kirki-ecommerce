/**
 * Alpine component: dropdown
 * A reusable, accessible select-style dropdown with keyboard navigation and search.
 *
 * PHP usage (basic):
 *   <div x-data="dropdown({
 *     items: [
 *       { value: 'usd', label: 'US Dollar', sublabel: '(USD $)' },
 *       { value: 'eur', label: 'Euro',      sublabel: '(EUR €)' },
 *     ],
 *     selected: 'usd',
 *     align: 'auto',
 *     onChange(item) { console.log(item); },
 *   })"
 *   @click.outside="close()"
 *   @keydown.escape.window="close(true)"
 *   >
 *     <!-- Trigger -->
 *     <button type="button" x-ref="trigger" @click="toggle()" :aria-expanded="isOpen" aria-haspopup="listbox">
 *       <span x-text="selectedItem?.label ?? placeholder"></span>
 *       <span x-show="selectedItem?.sublabel" x-text="selectedItem?.sublabel"></span>
 *     </button>
 *
 *     <!-- Panel -->
 *     <div x-ref="menu" x-show="isOpen" :class="{ 'kecom-dropdown-menu-end': isAlignEnd }" x-cloak role="listbox" :aria-activedescendant="activeId">
 *       <!-- Optional search -->
 *       <input type="text" x-ref="search" x-model="query" @keydown="onSearchKeydown" placeholder="Search…">
 *
 *       <!-- Items -->
 *       <ul>
 *         <template x-for="item in filteredItems" :key="item.value">
 *           <li
 *             :id="itemId(item)"
 *             role="option"
 *             :aria-selected="isSelected(item)"
 *             :class="{ 'is-active': isSelected(item), 'is-focused': isFocused(item) }"
 *             @click="select(item)"
 *             @mouseenter="focusedIndex = filteredItems.indexOf(item)"
 *           >
 *             <span x-text="item.label"></span>
 *             <span x-show="item.sublabel" x-text="item.sublabel"></span>
 *             <svg x-show="isSelected(item)" ...><!-- checkmark --></svg>
 *           </li>
 *         </template>
 *       </ul>
 *     </div>
 *   </div>
 */

export interface DropdownItem {
  value: string;
  label: string;
  sublabel?: string;
  flag?: string;
  code?: string;
  symbol?: string;
  disabled?: boolean;
  data?: Record<string, unknown>;
}

export type DropdownConfig = {
  selected?: string | null;
  items?: DropdownItem[];
  placeholder?: string;
  searchable?: boolean;
  align?: 'start' | 'end' | 'auto';
  onChange?: (item: DropdownItem) => void;
};

export type AlpineMagics = {
  $el: HTMLElement;
  $refs: Record<string, HTMLElement | undefined>;
  $dispatch: (event: string, detail?: unknown) => void;
  $nextTick: (callback: () => void) => void;
  $cleanup?: (callback: () => void) => void;
};

export type DropdownComponent = {
  isOpen: boolean;
  selected: string | null;
  items: DropdownItem[];
  placeholder: string;
  searchable: boolean;
  align: 'start' | 'end' | 'auto';
  isAlignEnd: boolean;
  query: string;
  focusedIndex: number;
  instanceId: number;

  readonly selectedItem: DropdownItem | null;
  readonly selectedLabel: string;
  readonly selectedSublabel: string;
  readonly filteredItems: DropdownItem[];
  readonly activeId: string | undefined;

  init(this: DropdownComponent & AlpineMagics): void;
  open(this: DropdownComponent & AlpineMagics): void;
  close(this: DropdownComponent & AlpineMagics, restoreFocus?: boolean): void;
  toggle(this: DropdownComponent & AlpineMagics): void;
  select(this: DropdownComponent & AlpineMagics, item: DropdownItem, restoreFocus?: boolean): void;
  isSelected(item: DropdownItem): boolean;
  isFocused(item: DropdownItem): boolean;
  itemId(item: DropdownItem): string;
  onTriggerKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent): void;
  onSearchKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent): void;
  onListKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent): void;
  moveFocus(this: DropdownComponent & AlpineMagics, direction: 1 | -1): void;
  scrollFocusedIntoView(this: DropdownComponent & AlpineMagics): void;
};

let dropdownIdCounter = 0;

export function dropdown(config: DropdownConfig = {}): DropdownComponent {
  const instanceId = ++dropdownIdCounter;
  const prefix = `kecom-dropdown-${instanceId}`;

  return {
    isOpen: false,
    selected: config.selected ?? null,
    items: config.items ?? [],
    placeholder: config.placeholder ?? '',
    searchable: config.searchable ?? false,
    align: config.align ?? 'auto',
    isAlignEnd: config.align === 'end',
    query: '',
    focusedIndex: -1,
    instanceId,

    get selectedItem(): DropdownItem | null {
      if (!this.selected) {
        return null;
      }
      return this.items.find((i) => i.value === this.selected) ?? null;
    },

    /** Primary label for the trigger button (falls back to placeholder). */
    get selectedLabel(): string {
      return this.selectedItem?.label ?? this.placeholder;
    },

    /** Secondary label for the trigger button (the sublabel of the selected item). */
    get selectedSublabel(): string {
      return this.selectedItem?.sublabel ?? '';
    },

    get filteredItems(): DropdownItem[] {
      if (!this.query.trim()) {
        return this.items;
      }
      const q = this.query.toLowerCase();
      return this.items.filter(
        (i) => i.label.toLowerCase().includes(q) || (i.sublabel ?? '').toLowerCase().includes(q),
      );
    },

    init(this: DropdownComponent & AlpineMagics) {
      const onDropdownOpened = (e: Event) => {
        const detail = (e as CustomEvent<{ id: number }>).detail;
        if (detail?.id !== this.instanceId && this.isOpen) {
          this.close(false);
        }
      };

      const onPopoverOpened = () => {
        if (this.isOpen) {
          this.close(false);
        }
      };

      window.addEventListener('kecom:dropdown:opened', onDropdownOpened);
      window.addEventListener('kecom:popover:opened', onPopoverOpened);

      // Clean up window listeners when component unmounts to prevent memory leaks
      this.$cleanup?.(() => {
        window.removeEventListener('kecom:dropdown:opened', onDropdownOpened);
        window.removeEventListener('kecom:popover:opened', onPopoverOpened);
      });
    },

    open(this: DropdownComponent & AlpineMagics) {
      this.isOpen = true;
      this.query = '';
      this.focusedIndex = this.items.findIndex((i) => i.value === this.selected);
      if (this.focusedIndex < 0 && this.items.length > 0) {
        this.focusedIndex = 0;
      }

      // Detect alignment to prevent overflowing the viewport edge
      if (this.align === 'end') {
        this.isAlignEnd = true;
      } else if (this.align === 'auto') {
        const rect = this.$el.getBoundingClientRect();
        const menuEl =
          this.$refs.menu ?? this.$el.querySelector<HTMLElement>('.kecom-dropdown-menu');
        // The menu is still hidden when this runs, so an unlaid-out element
        // measures 0 rather than undefined — fall back to the default width.
        const measuredMenuWidth = menuEl?.offsetWidth ?? 0;
        const menuWidth = measuredMenuWidth > 0 ? measuredMenuWidth : 280;
        this.isAlignEnd = rect.left + menuWidth > window.innerWidth - 16;
      } else {
        this.isAlignEnd = false;
      }

      this.$dispatch('kecom:dropdown:opened', { id: this.instanceId });

      if (this.searchable) {
        this.$nextTick(() => {
          this.$refs.search?.focus();
        });
      }
    },

    close(this: DropdownComponent & AlpineMagics, restoreFocus = false) {
      this.isOpen = false;
      this.query = '';
      this.focusedIndex = -1;
      this.$dispatch('kecom:dropdown:closed', { id: this.instanceId });

      if (restoreFocus) {
        this.$nextTick(() => {
          const trigger =
            this.$refs.trigger ??
            this.$el.querySelector<HTMLElement>(
              '.kecom-dropdown-trigger, .kecom-currency-switcher-trigger, button',
            );
          trigger?.focus();
        });
      }
    },

    toggle(this: DropdownComponent & AlpineMagics) {
      if (this.isOpen) {
        this.close(true);
      } else {
        this.open();
      }
    },

    select(this: DropdownComponent & AlpineMagics, item: DropdownItem, restoreFocus = true) {
      if (item.disabled) {
        return;
      }

      this.selected = item.value;
      this.close(restoreFocus);
      if (config.onChange) {
        config.onChange(item);
      }
      this.$dispatch('kecom:dropdown:changed', { id: this.instanceId, item });
    },

    isSelected(item: DropdownItem): boolean {
      return this.selected === item.value;
    },

    isFocused(item: DropdownItem): boolean {
      return this.filteredItems.indexOf(item) === this.focusedIndex;
    },

    itemId(item: DropdownItem): string {
      return `${prefix}-item-${item.value}`;
    },

    get activeId(): string | undefined {
      const item = this.filteredItems[this.focusedIndex];
      return item ? this.itemId(item) : undefined;
    },

    /** Attach to the trigger button with @keydown */
    onTriggerKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!this.isOpen) {
            this.open();
          } else {
            this.moveFocus(1);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!this.isOpen) {
            this.open();
          } else {
            this.moveFocus(-1);
          }
          break;
        case 'Escape':
          if (this.isOpen) {
            event.preventDefault();
            this.close(true);
          }
          break;
      }
    },

    /** Attach to the search input (when searchable) with @keydown */
    onSearchKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.moveFocus(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.moveFocus(-1);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.filteredItems[this.focusedIndex]) {
            this.select(this.filteredItems[this.focusedIndex], true);
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.close(true);
          break;
        case 'Home':
          event.preventDefault();
          this.focusedIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          this.focusedIndex = Math.max(0, this.filteredItems.length - 1);
          break;
      }
    },

    /** Attach to the list with @keydown when NOT searchable */
    onListKeydown(this: DropdownComponent & AlpineMagics, event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.moveFocus(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.moveFocus(-1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (this.filteredItems[this.focusedIndex]) {
            this.select(this.filteredItems[this.focusedIndex], true);
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.close(true);
          break;
        case 'Home':
          event.preventDefault();
          this.focusedIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          this.focusedIndex = Math.max(0, this.filteredItems.length - 1);
          break;
      }
    },

    moveFocus(this: DropdownComponent & AlpineMagics, direction: 1 | -1) {
      const max = this.filteredItems.length - 1;
      if (max < 0) {
        return;
      }
      this.focusedIndex = Math.min(Math.max(this.focusedIndex + direction, 0), max);
      this.scrollFocusedIntoView();
    },

    scrollFocusedIntoView(this: DropdownComponent & AlpineMagics) {
      this.$nextTick(() => {
        const item = this.filteredItems[this.focusedIndex];
        if (!item) {
          return;
        }
        const el = document.getElementById(this.itemId(item));
        el?.scrollIntoView({ block: 'nearest' });
      });
    },
  };
}
