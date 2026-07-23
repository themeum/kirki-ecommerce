import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { css, type SerializedStyles } from '@emotion/react';
import { Minus, PlusCircle } from 'lucide-react';

import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import Chip from '@/components/ui/chip';
import { theme } from '@/theme';
import { itemCenter, scoped } from '@/theme/mixins';
import type { LabelFieldProps, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type SuggestionOption = SelectOption & {
  leftIcon?: ReactNode;
};

type SuggestionsProps = LabelFieldProps & {
  suggestions?: SuggestionOption[];
  selectedItems?: SuggestionOption[];
  onSelect?: (item: SuggestionOption) => void;
  onRemove?: (item: SuggestionOption) => void;
  onAddItem?: (query: string) => void;
  onSearchChange?: (value: string) => void;
  onClick?: () => void;
  onBlur?: () => void;
  addItemLabel?: string;
  hasAddBtn?: boolean;
  placeholder?: string;
  value?: string;
  searchKey?: string | number;
  readOnly?: boolean;
  showRemoveIcon?: boolean;
  css?: SerializedStyles;
};

/**
 * Multi-select suggestions field with searchable list, chips, and optional add row.
 *
 * @param props Component props.
 *
 * @returns Suggestions element.
 * @since 1.0.0
 */
const Suggestions = (props: SuggestionsProps) => {
  const {
    suggestions = [],
    selectedItems = [],
    onSelect = () => {},
    onRemove = () => {},
    onAddItem = () => {},
    onSearchChange = () => {},
    onClick = () => {},
    onBlur = () => {},
    addItemLabel = __('Add item', 'kirki-ecommerce'),
    hasAddBtn = true,
    placeholder = __('Type to search..', 'kirki-ecommerce'),
    label,
    helpText,
    error,
    value,
    searchKey,
    readOnly = false,
    showRemoveIcon = true,
    css: cssProp,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? '');
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const selectedValues = useMemo(
    () => new Set(selectedItems.map((item) => String(item.value))),
    [selectedItems],
  );

  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();

    return suggestions.filter((item) => {
      if (selectedValues.has(String(item.value))) {
        return false;
      }

      if (!query) {
        return true;
      }

      return item.title.toLowerCase().includes(query);
    });
  }, [suggestions, selectedValues, inputValue]);

  const canOpen = hasAddBtn || filteredSuggestions.length > 0;

  const handleSearchChange = (nextValue: string) => {
    setInputValue(nextValue);
    onSearchChange(nextValue);
  };

  const handleSelect = (item: SuggestionOption) => {
    onSelect(item);
    handleSearchChange('');
    setIsOpen(false);
  };

  const handleAddItem = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    onAddItem(trimmed);
    handleSearchChange('');
    setIsOpen(false);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddItem(event.currentTarget.value);
    }
  };

  const handleInputClick = () => {
    if (canOpen || suggestions.length > 0) {
      setIsOpen(true);
    }
    onClick();
  };

  return (
    <div css={[styles.root, cssProp]}>
      {label && (
        <Label error={Boolean(error)} helpText={error ? error : helpText}>
          {label}
        </Label>
      )}
      <div css={styles.shell}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverAnchor asChild>
            <div ref={anchorRef} css={styles.inputWrap}>
              <Input
                key={searchKey}
                value={inputValue}
                placeholder={placeholder}
                error={Boolean(error)}
                readOnly={readOnly}
                css={css([
                  styles.input,
                  selectedItems.length > 0 && styles.inputBorderNone,
                ])}
                onChange={(event) => handleSearchChange(event.target.value)}
                onBlur={onBlur}
                onClick={handleInputClick}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          </PopoverAnchor>
          {canOpen && (
            <PopoverContent
              align="start"
              sideOffset={4}
              role="listbox"
              css={styles.content}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
              onInteractOutside={(event) => {
                if (anchorRef.current?.contains(event.target as Node)) {
                  event.preventDefault();
                }
              }}
            >
              {hasAddBtn && (
                <>
                  <div
                    role="option"
                    tabIndex={0}
                    css={styles.item}
                    onClick={() => handleAddItem(inputValue)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleAddItem(inputValue);
                      }
                    }}
                  >
                    <span css={styles.itemIcon}>
                      <PlusCircle size={16} aria-hidden="true" />
                    </span>
                    <span>{addItemLabel}</span>
                  </div>
                  {filteredSuggestions.length > 0 && <Separator />}
                </>
              )}
              {filteredSuggestions.map((option, index) => (
                <div
                  role="option"
                  tabIndex={0}
                  css={styles.item}
                  key={`${option.value}-${index}`}
                  onClick={() => handleSelect(option)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect(option);
                    }
                  }}
                >
                  {option.leftIcon && (
                    <div css={styles.itemIcon}>{option.leftIcon}</div>
                  )}
                  {option.color && (
                    <div
                      css={styles.swatch}
                      style={{ background: option.color }}
                      aria-hidden="true"
                    />
                  )}
                  <div css={styles.itemText}>{option.title}</div>
                </div>
              ))}
            </PopoverContent>
          )}
        </Popover>
        {selectedItems.length > 0 && (
          <div css={styles.chips}>
            {selectedItems.map((item, index) => (
              <Chip
                key={`${item.value}-${index}`}
                text={item.title}
                img={item.tagIcon}
                subText={item.subText}
                color={item.color}
                onRemove={() => onRemove(item)}
                closeIcon={
                  showRemoveIcon ? (
                    <Minus size={14} aria-hidden="true" />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Suggestions.displayName = 'Suggestions';

export default Suggestions;
export type { SuggestionOption, SuggestionsProps };

const styles = {
  root: scoped({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  }),
  shell: scoped({
    overflow: 'hidden',
  }),
  inputWrap: scoped({
    position: 'relative',
    width: '100%',
  }),
  input: scoped({
    backgroundColor: theme.colors.background.fill,
    width: '100%',
    outline: 'none',
    cursor: 'text',
  }),
  inputBorderNone: scoped({
    borderBottom: 'none',
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
    '&:focus': {
      outline: 'none',
      boxShadow: 'none',
    },
  }),
  content: scoped({
    width: 'var(--radix-popover-trigger-width)',
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: theme.spacing.xs,
    maxHeight: '240px',
    overflowY: 'auto',
    rowGap: 0,
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.colors.background.fillBrand} ${theme.colors.background.surfaceTertiary}`,
    '&::-webkit-scrollbar': {
      height: '4px',
      width: '100%',
      WebkitAppearance: 'none',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.colors.background.fill,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.colors.background.fillBrand,
      borderRadius: theme.radius.sm,
    },
  }),
  item: scoped({
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    ...itemCenter(),
    justifyContent: 'flex-start',
    columnGap: theme.spacing.md,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  }),
  itemIcon: scoped({
    minWidth: '16px',
    ...itemCenter(),
  }),
  itemText: scoped({
    ...itemCenter(),
    columnGap: theme.spacing.md,
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  chips: scoped({
    minHeight: '52.2px',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.default}`,
    padding: theme.spacing.lg,
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    overflow: 'hidden',
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  }),
  swatch: scoped({
    height: '16px',
    width: '16px',
    borderRadius: theme.radius.full,
    flexShrink: 0,
  }),
};
