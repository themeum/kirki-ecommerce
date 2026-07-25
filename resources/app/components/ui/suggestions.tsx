import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { css, type SerializedStyles, type Theme } from '@emotion/react';
import { Minus, PlusCircle } from 'lucide-react';

import Chip from '@/components/ui/chip';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import Input from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { itemCenter, scoped, uiFocusRing } from '@/theme/mixins';
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
  const fieldRef = useRef<HTMLDivElement>(null);

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
  const hasSelectedItems = selectedItems.length > 0;
  const canAddItem = inputValue.trim().length > 0;

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
    <Field data-invalid={error ? true : undefined} css={css([styles.root, cssProp])}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div
            ref={fieldRef}
            data-error={error ? 'true' : undefined}
            css={styles.field}
          >
            <Input
              key={searchKey}
              value={inputValue}
              placeholder={placeholder}
              readOnly={readOnly}
              css={css([
                styles.input,
                hasSelectedItems && styles.inputWithChips,
              ])}
              onChange={(event) => handleSearchChange(event.target.value)}
              onBlur={onBlur}
              onClick={handleInputClick}
              onKeyDown={handleInputKeyDown}
            />
            {hasSelectedItems && (
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
              if (fieldRef.current?.contains(event.target as Node)) {
                event.preventDefault();
              }
            }}
          >
            {hasAddBtn && (
              <>
                <div
                  role="option"
                  tabIndex={canAddItem ? 0 : -1}
                  aria-disabled={!canAddItem}
                  css={[styles.item, !canAddItem && styles.itemDisabled]}
                  onClick={() => {
                    if (!canAddItem) {
                      return;
                    }
                    handleAddItem(inputValue);
                  }}
                  onKeyDown={(event) => {
                    if (!canAddItem) {
                      return;
                    }
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
                {filteredSuggestions.length > 0 && (
                  <Separator
                    marginTop={theme.spacing[2]}
                    marginBottom={theme.spacing[2]}
                    css={styles.separator}
                  />
                )}
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
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
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
    gap: theme.spacing[2],
  }),
  field: scoped({
    width: '100%',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
    overflow: 'hidden',
    '&:focus-within': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-error="true"]': {
      borderColor: theme.colors.border.critical,
      '&:focus-within': {
        borderColor: theme.colors.border.critical,
        ...uiFocusRing(theme as Theme, theme.colors.border.critical),
      },
    },
  }),
  input: scoped({
    width: '100%',
    border: 'none',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
    outline: 'none',
    cursor: 'text',
    boxShadow: 'none',
    '&:focus, &:focus-visible': {
      outline: 'none',
      boxShadow: 'none',
      borderColor: 'transparent',
    },
  }),
  inputWithChips: scoped({
    borderBottom: `1px solid ${theme.colors.border.default}`,
  }),
  content: scoped({
    width: 'var(--radix-popover-trigger-width)',
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: theme.spacing[1],
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
  separator: scoped({
    width: `calc(100% + ${theme.spacing[1]} + ${theme.spacing[1]})`,
    marginLeft: `-${theme.spacing[1]}`,
    marginRight: `-${theme.spacing[1]}`,
  }),
  item: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    ...itemCenter(),
    justifyContent: 'flex-start',
    columnGap: theme.spacing[2],
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  }),
  itemDisabled: scoped({
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  }),
  itemIcon: scoped({
    minWidth: '16px',
    ...itemCenter(),
  }),
  itemText: scoped({
    ...itemCenter(),
    columnGap: theme.spacing[2],
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  chips: scoped({
    minHeight: '52.2px',
    padding: theme.spacing[3],
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
  }),
  swatch: scoped({
    height: '16px',
    width: '16px',
    borderRadius: theme.radius.full,
    flexShrink: 0,
  }),
};
