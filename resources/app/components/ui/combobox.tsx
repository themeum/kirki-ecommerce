import { type CSSObject } from '@emotion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { defaultFilter } from 'cmdk';
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, scoped, scopedMerge } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type ComboboxOption = {
  label: string;
  value: string;
  leftIcon?: ReactNode;
};

// Fixed so the virtualizer's estimate is exact: it positions rows from this
// value alone, and a row that measured taller would overlap the next one.
const VIRTUAL_ROW_HEIGHT = 32;

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  multiple?: boolean;
  creatable?: boolean;
  addItemLabel?: string;
  onAddItem?: (query: string) => void;
  cssOverride?: CSSObject;
  listCss?: CSSObject;
  searchInputCss?: CSSObject;
  virtualized?: boolean;
};

/**
 * Searchable select with optional creatable add-item row.
 *
 * @param props Component props.
 *
 * @returns Combobox element.
 * @since 1.0.0
 */
const Combobox = ({
  options,
  value,
  onChange = noop,
  placeholder = __('Select...', 'kirki-ecommerce'),
  searchPlaceholder = __('Search...', 'kirki-ecommerce'),
  emptyText = __('No results found.', 'kirki-ecommerce'),
  disabled = false,
  error = false,
  multiple = false,
  creatable = false,
  addItemLabel = __('Add item', 'kirki-ecommerce'),
  onAddItem = noop,
  cssOverride,
  listCss,
  searchInputCss,
  virtualized = false,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  // A callback ref, not `useRef`: Radix mounts the popover's content in its
  // own commit without re-rendering this component, so a ref object would
  // still read null when the virtualizer's layout effect resolves the scroll
  // element — leaving it permanently unsubscribed from scroll while the first
  // page of rows still painted from `initialRect`. Storing the node in state
  // re-renders us so the virtualizer picks it up.
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const [triggerHeight, setTriggerHeight] = useState(0);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

  const hasLeadingIcons = options.some((option) => Boolean(option.leftIcon));

  // Virtualized rows are not mounted, so cmdk cannot score them and its
  // sorting would reorder the DOM against the virtualizer's absolute
  // positioning. Filtering moves here, reusing cmdk's own scorer so matches
  // and ranking stay identical to the non-virtualized path.
  const visibleOptions = useMemo(() => {
    if (!virtualized) {
      return options;
    }

    const query = search.trim();

    if (!query) {
      return options;
    }

    return options
      .map((option) => ({ option, score: defaultFilter(option.label, query) }))
      .filter((scored) => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((scored) => scored.option);
  }, [options, search, virtualized]);

  const virtualizer = useVirtualizer({
    count: visibleOptions.length,
    getScrollElement: () => listElement,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    // Load-bearing for keyboard navigation, not just paint smoothness: cmdk
    // moves selection between mounted rows only, so this buffer is what an
    // arrow key past the viewport lands on before its scroll mounts the next
    // batch.
    overscan: 10,
    getItemKey: (index) => visibleOptions[index].value,
    // Assumed size until the ResizeObserver reports the real one — avoids a
    // flash of zero rows on first paint, and (as a side effect) means jsdom,
    // which never fires ResizeObserver callbacks, still has rows to interact
    // with in tests.
    initialRect: { width: 320, height: 240 },
  });

  // Without this, narrowing a list the merchant has scrolled down leaves them
  // staring at a blank region past the end of the shorter result set.
  useEffect(() => {
    if (!virtualized || !listElement) {
      return;
    }

    listElement.scrollTop = 0;
  }, [search, virtualized, listElement]);

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const showCreatable = creatable && trimmedSearch.length > 0 && !hasExactMatch;

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue];
      onChange(nextValues);
      return;
    }

    onChange(optionValue === value ? '' : optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleRemove = (optionValue: string) => {
    if (!multiple) {
      return;
    }
    onChange(selectedValues.filter((item) => item !== optionValue));
  };

  const handleAddItem = () => {
    if (!trimmedSearch) {
      return;
    }

    onAddItem(trimmedSearch);
    setOpen(false);
    setSearch('');
  };

  const triggerLabel = (): ReactNode => {
    if (multiple) {
      if (selectedOptions.length === 0) {
        return <span css={scoped(styles.placeholder)}>{placeholder}</span>;
      }

      return (
        <span css={scoped(styles.tags)}>
          {selectedOptions.map((option) => (
            <span key={option.value} css={scoped(styles.tag)}>
              {option.leftIcon && <span css={scoped(styles.leadingIcon)}>{option.leftIcon}</span>}
              {option.label}
              <button
                type="button"
                css={scoped(styles.tagRemove)}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemove(option.value);
                }}
                aria-label={__('Remove', 'kirki-ecommerce')}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </span>
      );
    }

    if (selectedOptions.length > 0) {
      const selectedOption = selectedOptions[0];

      if (!selectedOption.leftIcon) {
        return selectedOption.label;
      }

      return (
        <span css={scoped(styles.triggerOption)}>
          <span css={scoped(styles.leadingIcon)}>{selectedOption.leftIcon}</span>
          {selectedOption.label}
        </span>
      );
    }

    return <span css={scoped(styles.placeholder)}>{placeholder}</span>;
  };

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setTriggerHeight(triggerRef.current?.offsetHeight ?? 0);
        }
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          data-error={error ? 'true' : undefined}
          css={scopedMerge(styles.trigger, error && styles.triggerError, cssOverride)}
        >
          <span css={scoped(styles.value)}>{triggerLabel()}</span>
          <ChevronsUpDown size={16} css={scoped(styles.chevron)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={listboxId}
        align="start"
        sideOffset={-triggerHeight}
        cssOverride={styles.content}
      >
        <Command shouldFilter={!virtualized}>
          <CommandInput
            placeholder={searchPlaceholder}
            wrapperCss={styles.searchRow}
            cssOverride={searchInputCss}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList ref={setListElement} cssOverride={listCss}>
            {!showCreatable &&
              // With `shouldFilter={false}` cmdk no longer knows the match
              // count, so the virtualized path resolves the empty state itself.
              (virtualized ? (
                visibleOptions.length === 0 && (
                  <div css={scoped(styles.emptyState)}>{emptyText}</div>
                )
              ) : (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ))}
            {showCreatable && (
              <>
                <CommandGroup>
                  <CommandItem value={trimmedSearch} onSelect={handleAddItem}>
                    <span css={scoped(styles.addIcon)}>
                      <PlusCircle size={16} aria-hidden="true" />
                    </span>
                    {addItemLabel}
                  </CommandItem>
                </CommandGroup>
                {options.length > 0 && <Separator />}
              </>
            )}
            {virtualized ? (
              visibleOptions.length > 0 && (
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    position: 'relative',
                    width: '100%',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const option = visibleOptions[virtualRow.index];
                    const isSelected = selectedValues.includes(option.value);

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        css={scoped(styles.virtualRow)}
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <CommandItem
                          value={option.value}
                          onSelect={() => handleSelect(option.value)}
                          cssOverride={styles.virtualItem}
                        >
                          <span
                            css={scopedMerge(styles.itemCheck, !isSelected && styles.itemCheckEmpty)}
                          >
                            {isSelected && <Check size={14} />}
                          </span>
                          {hasLeadingIcons && (
                            <span css={scoped(styles.leadingIcon)}>{option.leftIcon}</span>
                          )}
                          <span css={scoped(styles.itemLabel)}>{option.label}</span>
                        </CommandItem>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <span
                        css={scopedMerge(styles.itemCheck, !isSelected && styles.itemCheckEmpty)}
                      >
                        {isSelected && <Check size={14} />}
                      </span>
                      {hasLeadingIcons && (
                        <span css={scoped(styles.leadingIcon)}>{option.leftIcon}</span>
                      )}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

Combobox.displayName = 'Combobox';

export default Combobox;
export type { ComboboxOption, ComboboxProps };

const styles = defineStyles({
  trigger: {
    width: '100%',
    minHeight: '32px',
    maxHeight: '32px',
    border: `1px solid ${theme.colors.border.secondary}`,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing[2],
    cursor: 'pointer',
    textAlign: 'left',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.background.fillBrand,
    },
    '&:disabled': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  },
  triggerError: {
    border: `1px solid ${theme.colors.background.fillCritical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.background.fillCritical,
    },
  },
  value: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
  },
  placeholder: {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  triggerOption: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[2],
    minWidth: 0,
  },
  // Sized so a row without an icon still lines its label up with the rows
  // that have one. Reserved only when some option in the list carries an icon.
  leadingIcon: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexShrink: 0,
    minWidth: '20px',
  },
  chevron: {
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  },
  tags: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
    whiteSpace: 'normal',
  },
  tag: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[1],
    maxWidth: '100%',
    padding: `2px ${theme.spacing[2]}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceAlt,
    ...theme.typography.small(),
  },
  tagRemove: {
    ...itemCenter(),
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover': {
      color: theme.colors.text.primary,
    },
  },
  content: {
    minWidth: 'calc(var(--radix-popover-trigger-width) + 2px)',
    maxWidth: 'none',
    padding: 0,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  // Less the panel's own top border, so the row's divider lands exactly where
  // the trigger's bottom edge was and the trigger is covered without a sliver.
  searchRow: {
    minHeight: 'calc(var(--radix-popover-trigger-height) - 1px)',
    padding: `0 ${theme.spacing[3]}`,
    borderBottom: 'none',
  },
  itemCheck: {
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: theme.colors.text.primary,
  },
  itemCheckEmpty: {
    opacity: 0,
  },
  addIcon: {
    ...itemCenter(),
    flexShrink: 0,
  },
  virtualRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  // Fixed height keeps the virtualizer's estimate exact; the label is clipped
  // rather than wrapped, since a second line would desynchronise every offset
  // below it.
  virtualItem: {
    height: `${VIRTUAL_ROW_HEIGHT}px`,
    minHeight: `${VIRTUAL_ROW_HEIGHT}px`,
    boxSizing: 'border-box',
  },
  itemLabel: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
    textAlign: 'center',
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
});
