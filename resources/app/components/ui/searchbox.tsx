import type { CSSObject } from '@emotion/react';
import { Search } from 'lucide-react';
import { type CSSProperties, forwardRef, type KeyboardEvent, type RefObject, useEffect, useRef, useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { InputState } from '@/types';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type SearchboxProps = {
  value?: string;
  onChange?: (value: string | number) => void;
  onClick?: () => void;
  onEnter?: (value: string | number) => void;
  onBlur?: (value: string | number) => void;
  style?: CSSProperties;
  cssOverride?: CSSObject;
  label?: string;
  helpText?: string;
  placeholder?: string;
  state?: InputState;
  error?: string | boolean;
  readOnly?: boolean;
  delay?: number;
};

/**
 * Debounce a callback by the given delay.
 *
 * @param fn Callback to debounce.
 * @param delay Delay in milliseconds.
 *
 * @returns Debounced function.
 * @since 1.0.0
 */
function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Debounced search input with a fixed left search icon.
 *
 * @param props Component props.
 *
 * @returns Searchbox element.
 * @since 1.0.0
 */
const Searchbox = forwardRef<HTMLInputElement, SearchboxProps>((props, ref) => {
  const {
    value,
    onChange = noop,
    onClick = noop,
    onEnter = noop,
    onBlur = noop,
    style = {},
    cssOverride,
    label,
    helpText,
    placeholder = __('Search', 'kirki-ecommerce'),
    state,
    error,
    readOnly,
    delay = 300,
  } = props;

  const fallbackRef = useRef<HTMLInputElement>(null);
  const inputRef =
    (ref as RefObject<HTMLInputElement | null>) || fallbackRef;
  const [searchValue, setSearchValue] = useState(value ?? '');

  useEffect(() => {
    setSearchValue(value ?? '');
  }, [value]);

  const debouncedOnChange = useRef(debounce(onChange, delay)).current;

  const handleSearchChange = (nextValue: string) => {
    setSearchValue(nextValue);
    debouncedOnChange(nextValue);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onEnter(event.currentTarget.value);
    }
  };

  const isDisabled = state === 'disabled';

  return (
    <Field
      data-invalid={error ? true : undefined}
      cssOverride={styles.root}
      style={style}
    >
      {label && <FieldLabel>{label}</FieldLabel>}
      <InputGroup
        error={Boolean(error)}
        disabled={isDisabled}
        cssOverride={mergeCss(styles.group, cssOverride)}
      >
        <InputGroupInput
          type={searchValue ? 'text' : 'search'}
          ref={inputRef}
          onChange={(event) => handleSearchChange(event.target.value)}
          onBlur={(event) => onBlur(event.target.value)}
          value={searchValue}
          placeholder={placeholder}
          onClick={onClick}
          onKeyDown={handleInputKeyDown}
          readOnly={readOnly}
          disabled={isDisabled}
          aria-invalid={Boolean(error) || undefined}
        />
        <InputGroupAddon align="inline-start">
          <Search size={16} aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
});

Searchbox.displayName = 'Searchbox';

export default Searchbox;

const styles = defineStyles({
  root: {
    width: '100%',
  },
  group: {
    minHeight: theme.spacing[8],
    height: theme.spacing[8],
    '& [data-slot="input-group-control"]': {
      minHeight: theme.spacing[8],
    },
  },
});
