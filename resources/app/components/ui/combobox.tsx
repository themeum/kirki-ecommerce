import { type CSSObject } from '@emotion/react';
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';
import { type ReactNode, useId, useRef, useState } from 'react';

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
};

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
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerHeight, setTriggerHeight] = useState(0);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

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
      return selectedOptions[0].label;
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
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            wrapperCss={styles.searchRow}
            cssOverride={searchInputCss}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList cssOverride={listCss}>
            {!showCreatable && <CommandEmpty>{emptyText}</CommandEmpty>}
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
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <span css={scopedMerge(styles.itemCheck, !isSelected && styles.itemCheckEmpty)}>
                      {isSelected && <Check size={14} />}
                    </span>
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
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
});
