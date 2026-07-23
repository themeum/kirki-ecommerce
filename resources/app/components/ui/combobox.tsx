import { useState, type ReactNode } from 'react';
import { type SerializedStyles, type Theme } from '@emotion/react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { theme } from '@/theme';
import {
  flexCenter,
  fontGeneralSettings,
  itemCenter,
  scoped,
  uiFocusRing,
} from '@/theme/mixins';
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
  css?: SerializedStyles;
  listCss?: SerializedStyles;
  searchInputCss?: SerializedStyles;
};

const Combobox = ({
  options,
  value,
  onChange = () => {},
  placeholder = __('Select...', 'kirki-ecommerce'),
  searchPlaceholder = __('Search...', 'kirki-ecommerce'),
  emptyText = __('No results found.', 'kirki-ecommerce'),
  disabled = false,
  error = false,
  multiple = false,
  css: cssProp,
  listCss,
  searchInputCss,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

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
  };

  const handleRemove = (optionValue: string) => {
    if (!multiple) {
      return;
    }
    onChange(selectedValues.filter((item) => item !== optionValue));
  };

  const triggerLabel = (): ReactNode => {
    if (multiple) {
      if (selectedOptions.length === 0) {
        return <span css={styles.placeholder}>{placeholder}</span>;
      }

      return (
        <span css={styles.tags}>
          {selectedOptions.map((option) => (
            <span key={option.value} css={styles.tag}>
              {option.label}
              <button
                type="button"
                css={styles.tagRemove}
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

    return <span css={styles.placeholder}>{placeholder}</span>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-error={error ? 'true' : undefined}
          css={[styles.trigger, error && styles.triggerError, cssProp]}
        >
          <span css={styles.value}>{triggerLabel()}</span>
          <ChevronsUpDown size={16} css={styles.chevron} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" css={styles.content}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} css={searchInputCss} />
          <CommandList css={listCss}>
            <CommandEmpty>{emptyText}</CommandEmpty>
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
                      css={[styles.itemCheck, !isSelected && styles.itemCheckEmpty]}
                    >
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

const styles = {
  trigger: scoped({
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing.md,
    ...fontGeneralSettings(theme as Theme),
    cursor: 'pointer',
    textAlign: 'left',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&:disabled': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  }),
  triggerError: scoped({
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme as Theme, theme.colors.border.critical),
    },
  }),
  value: scoped({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.primary,
  }),
  placeholder: scoped({
    color: theme.colors.text.secondary,
    opacity: 0.8,
  }),
  chevron: scoped({
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  }),
  tags: scoped({
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    whiteSpace: 'normal',
  }),
  tag: scoped({
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing.xs,
    maxWidth: '100%',
    padding: `2px ${theme.spacing.md}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceAlt,
    fontSize: '12px',
    lineHeight: '18px',
  }),
  tagRemove: scoped({
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
  }),
  content: scoped({
    width: 'var(--radix-popover-trigger-width)',
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: 0,
    overflow: 'hidden',
  }),
  itemCheck: scoped({
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: theme.colors.text.primary,
  }),
  itemCheckEmpty: scoped({
    opacity: 0,
  }),
};
