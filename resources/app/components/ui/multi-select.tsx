import { type CSSObject } from '@emotion/react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Minus, PlusCircle } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';

import Chip from '@/components/ui/chip';
import ChipField from '@/components/ui/chip-field';
import { chipFieldControlCss } from '@/components/ui/chip-field-styles';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, scoped, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

/**
 * Minimum shape every option must satisfy. `title` backs the default
 * rendering and the search filter; `value` backs the default identity.
 */
type MultiSelectOption = {
  value: string | number;
  title: string;
};

type MultiSelectProps<TOption extends MultiSelectOption> = {
  options: TOption[];
  value: TOption[];
  onChange: (next: TOption[]) => void;
  /** Identity of an option. Defaults to `String(option.value)`. */
  getOptionId?: (option: TOption) => string;
  /**
   * Renders an option's content inside a list row. Everything beyond the
   * plain title — a colour swatch, a thumbnail, a subtitle — is composed
   * in here so this component never needs to learn about it.
   */
  renderOption?: (option: TOption) => ReactNode;
  /** Renders a selected option's content inside its chip. */
  renderChip?: (option: TOption) => ReactNode;
  /**
   * Hands the search text to the caller so it can fetch matching options
   * itself. Supplying it also turns off cmdk's own filtering — server
   * results are already filtered, and matches on anything outside `title`
   * (an email, a SKU) would otherwise be filtered back out.
   */
  onSearchChange?: (query: string) => void;
  /**
   * Called with the trimmed search text when the create row is chosen. If it
   * returns a promise, the create row stays pending until it settles and the
   * search text is only cleared once it resolves — so a failed create leaves
   * what the user typed in place.
   */
  onCreate?: (query: string) => void | Promise<void>;
  createLabel?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  cssOverride?: CSSObject;
};

/**
 * Multi-select field: a search input with a popover option list and the
 * current selection listed as chips beneath it, inside one bordered box.
 *
 * Owns behaviour only — search, open state, selection, removal and the
 * create row. Presentation of an option is supplied by the caller through
 * `renderOption` / `renderChip`.
 *
 * @param props Component props.
 *
 * @returns MultiSelect element.
 * @since 1.0.0
 */
const MultiSelect = <TOption extends MultiSelectOption>({
  options,
  value,
  onChange,
  getOptionId = (option) => String(option.value),
  renderOption = (option) => option.title,
  renderChip = (option) => option.title,
  onSearchChange,
  onCreate,
  createLabel = __('Add item', 'kirki-ecommerce'),
  placeholder = __('Type to search..', 'kirki-ecommerce'),
  emptyText = __('No results found.', 'kirki-ecommerce'),
  disabled = false,
  error = false,
  cssOverride,
}: MultiSelectProps<TOption>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(value.map(getOptionId));
  const trimmedSearch = search.trim();
  const hasExactMatch = options.some(
    (option) => option.title.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const showCreate = Boolean(onCreate) && trimmedSearch.length > 0 && !hasExactMatch;

  const handleToggle = (option: TOption) => {
    const id = getOptionId(option);

    if (selectedIds.has(id)) {
      onChange(value.filter((item) => getOptionId(item) !== id));
      return;
    }

    onChange([...value, option]);
    setSearch('');
  };

  const handleRemove = (option: TOption) => {
    if (disabled) {
      return;
    }

    const id = getOptionId(option);
    onChange(value.filter((item) => getOptionId(item) !== id));
  };

  const handleCreate = async () => {
    if (!onCreate || !trimmedSearch || isCreating) {
      return;
    }

    const result = onCreate(trimmedSearch);

    // A promise means the caller is persisting something: hold the popover
    // open with the typed text until it settles, so a rejection is recoverable.
    if (result instanceof Promise) {
      setIsCreating(true);
      try {
        await result;
      } catch {
        return;
      } finally {
        setIsCreating(false);
      }
    }

    setSearch('');
    setIsOpen(false);
  };

  return (
    // cmdk owns arrow-key navigation and filtering. Its keydown handler sits
    // on this root, so the input has to be a DOM descendant of it; the list
    // may be portalled away since cmdk looks items up through the list ref.
    <Command shouldFilter cssOverride={styles.command}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <ChipField
            ref={fieldRef}
            error={error}
            disabled={disabled}
            cssOverride={cssOverride}
            control={
              // cmdk's Input directly rather than ui/command's CommandInput:
              // that one ships a search icon and its own bordered wrapper,
              // which this layout does not want.
              <CommandPrimitive.Input
                value={search}
                placeholder={placeholder}
                disabled={disabled}
                css={scoped(chipFieldControlCss)}
                onValueChange={(nextValue) => {
                  setSearch(nextValue);
                  onSearchChange?.(nextValue);
                  if (!isOpen) {
                    setIsOpen(true);
                  }
                }}
                onClick={() => {
                  if (!disabled) {
                    setIsOpen(true);
                  }
                }}
              />
            }
            chips={
              value.length > 0
                ? (
                  // The chips sit inside cmdk's root, whose keydown handler
                  // preventDefaults Enter to select the active option. Stop
                  // here so Enter still activates a chip's remove button.
                  <div
                    role="presentation"
                    css={scoped(styles.chipsGuard)}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {value.map((option) => (
                      <Chip
                        key={getOptionId(option)}
                        text={renderChip(option)}
                        closeIcon={<Minus size={14} aria-hidden="true" />}
                        onRemove={() => handleRemove(option)}
                      />
                    ))}
                  </div>
                )
                : undefined
            }
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          cssOverride={styles.content}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (fieldRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
        >
          <CommandList>
            {!showCreate && <CommandEmpty>{emptyText}</CommandEmpty>}
            {showCreate && (
              <>
                <CommandGroup>
                  <CommandItem
                    value={trimmedSearch}
                    disabled={isCreating}
                    onSelect={() => {
                      void handleCreate();
                    }}
                  >
                    <span css={scoped(styles.createIcon)}>
                      <PlusCircle size={16} aria-hidden="true" />
                    </span>
                    {createLabel}
                  </CommandItem>
                </CommandGroup>
                {options.length > 0 && <Separator />}
              </>
            )}
            <CommandGroup>
              {options.map((option) => {
                const id = getOptionId(option);
                const isSelected = selectedIds.has(id);

                return (
                  <CommandItem
                    key={id}
                    value={option.title}
                    onSelect={() => handleToggle(option)}
                  >
                    <span
                      css={scopedMerge(styles.check, !isSelected && styles.checkEmpty)}
                    >
                      {isSelected && <Check size={14} />}
                    </span>
                    {renderOption(option)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
};

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
export type { MultiSelectOption, MultiSelectProps };

const styles = defineStyles({
  command: {
    overflow: 'visible',
    backgroundColor: 'transparent',
    borderRadius: theme.radius.none,
  },
  // Transparent to layout so the chips stay flex children of ChipField's row.
  chipsGuard: {
    display: 'contents',
  },
  content: {
    width: 'var(--radix-popover-trigger-width)',
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: 0,
    overflow: 'hidden',
  },
  check: {
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: theme.colors.text.primary,
  },
  checkEmpty: {
    opacity: 0,
  },
  createIcon: {
    ...itemCenter(),
    flexShrink: 0,
  },
});
