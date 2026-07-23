import { css, type SerializedStyles } from '@emotion/react';
import { Search } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { InputState } from '@/types';
import { __ } from '@/wpi18n';

type SearchboxProps = {
  value?: string;
  onChange?: (value: string | number) => void;
  onClick?: () => void;
  onEnter?: (value: string | number) => void;
  onBlur?: (value: string | number) => void;
  style?: CSSProperties;
  css?: SerializedStyles;
  label?: string;
  helpText?: string;
  placeholder?: string;
  state?: InputState;
  error?: string | boolean;
  readOnly?: boolean;
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
    onChange = () => { },
    onClick = () => { },
    onEnter = () => { },
    onBlur = () => { },
    style = {},
    css: cssProp,
    label,
    helpText,
    placeholder = __('Search', 'kirki-ecommerce'),
    state,
    error,
    readOnly,
  } = props;

  const fallbackRef = useRef<HTMLInputElement>(null);
  const inputRef =
    (ref as RefObject<HTMLInputElement | null>) || fallbackRef;
  const [searchValue, setSearchValue] = useState(value ?? '');

  useEffect(() => {
    setSearchValue(value ?? '');
  }, [value]);

  const debouncedOnChange = useRef(debounce(onChange, 300)).current;

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
    <div css={styles.root} style={style}>
      {label && (
        <Label
          error={Boolean(error)}
          helpText={typeof error === 'string' ? error : helpText}
        >
          {label}
        </Label>
      )}
      <InputGroup
        error={Boolean(error)}
        disabled={isDisabled}
        css={css(styles.group, cssProp)}
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
        />
        <InputGroupAddon align="inline-start">
          <Search size={16} aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
});

Searchbox.displayName = 'Searchbox';

export default Searchbox;

const styles = {
  root: scoped({
    width: '100%',
  }),
  group: scoped({
    minHeight: theme.spacing['6xl'],
    height: theme.spacing['6xl'],
    '& [data-slot="input-group-control"]': {
      minHeight: theme.spacing['6xl'],
    },
  }),
};
