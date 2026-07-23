import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { css, type SerializedStyles } from '@emotion/react';
import { PlusCircle, Search } from 'lucide-react';

import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SuggestionDropdown from '@/components/ui/suggestion-dropdown';
import { theme } from '@/theme';
import { flexCenter, itemCenter, scoped } from '@/theme/mixins';
import type { InputState, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type SearchSuggestionOption = SelectOption & {
  leftIcon?: ReactNode;
};

type SearchboxProps = {
  value?: string;
  onChange?: (value: string | number) => void;
  onClick?: () => void;
  onEnter?: (value: string | number) => void;
  onBlur?: (value: string | number) => void;
  onOptionClick?: (option: SearchSuggestionOption) => void;
  style?: CSSProperties;
  suggestionArray?: SearchSuggestionOption[];
  css?: SerializedStyles;
  label?: string;
  helpText?: string;
  placeholder?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hasIcon?: boolean;
  hasAddBtn?: boolean;
  btnText?: string;
  onNewOptionAdd?: (value: string) => void;
  state?: InputState;
  error?: string | boolean;
  readOnly?: boolean;
  onClearInput?: () => void;
};

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

const Searchbox = forwardRef<HTMLInputElement, SearchboxProps>(
  (props, ref) => {
    const {
      value,
      onChange = () => {},
      onClick = () => {},
      onEnter = () => {},
      onBlur = () => {},
      onOptionClick = () => {},
      style = {},
      suggestionArray = [],
      css: cssProp,
      label,
      helpText,
      placeholder = __('Search', 'kirki-ecommerce'),
      leftIcon,
      rightIcon,
      hasIcon = true,
      hasAddBtn = false,
      btnText = 'Add',
      onNewOptionAdd = () => {},
      state,
      error,
      readOnly,
      onClearInput,
    } = props;

    const fallbackRef = useRef<HTMLInputElement>(null);
    const triggerRef =
      (ref as RefObject<HTMLInputElement | null>) || fallbackRef;
    const [openSuggestionDropdown, setOpenSuggestionDropDown] = useState(false);
    const [searchValue, setSearchValue] = useState(value ?? '');

    useEffect(() => {
      setSearchValue(value ?? '');
    }, [value]);

    const debouncedOnChange = useRef(debounce(onChange, 300)).current;

    const handleSearchChange = (nextValue: string) => {
      setSearchValue(nextValue);
      debouncedOnChange(nextValue);
    };

    const handleOptionClick = (option: SearchSuggestionOption) => {
      setOpenSuggestionDropDown(false);
      onOptionClick(option);
    };

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setOpenSuggestionDropDown(false);
        onEnter(event.currentTarget.value);
      }
    };

    const resolvedLeftIcon = leftIcon
      ? leftIcon
      : !hasIcon
        ? null
        : <Search size={16} aria-hidden="true" />;

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
        <div css={styles.inputWrap}>
          {resolvedLeftIcon && (
            <span css={[styles.icon, styles.iconLeft]}>{resolvedLeftIcon}</span>
          )}
          <Input
            type={searchValue ? 'text' : 'search'}
            ref={triggerRef}
            onChange={(event) => handleSearchChange(event.target.value)}
            onBlur={(event) => onBlur(event.target.value)}
            value={searchValue}
            placeholder={placeholder}
            onClick={() => {
              setOpenSuggestionDropDown(true);
              onClick();
            }}
            onKeyDown={handleInputKeyDown}
            css={css([
              Boolean(resolvedLeftIcon) && styles.inputHasLeftIcon,
              Boolean(rightIcon || onClearInput) && styles.inputHasRightIcon,
              cssProp,
            ])}
            error={Boolean(error)}
            readOnly={readOnly}
            disabled={state === 'disabled'}
          />
          {onClearInput ? (
            <span
              css={[styles.icon, styles.iconRight]}
              onClick={onClearInput}
            >
              {rightIcon}
            </span>
          ) : (
            rightIcon && (
              <span css={[styles.icon, styles.iconRight]}>{rightIcon}</span>
            )
          )}
        </div>
        {(suggestionArray.length > 0 || hasAddBtn) && (
          <SuggestionDropdown
            isOpen={openSuggestionDropdown}
            triggerRef={triggerRef}
            setIsOpen={setOpenSuggestionDropDown}
            onClose={() => setOpenSuggestionDropDown(false)}
          >
            {hasAddBtn && (
              <>
                <div
                  role="option"
                  tabIndex={0}
                  css={styles.suggestionItem}
                  onClick={() => {
                    onNewOptionAdd(triggerRef.current?.value ?? '');
                    setOpenSuggestionDropDown(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onNewOptionAdd(triggerRef.current?.value ?? '');
                      setOpenSuggestionDropDown(false);
                    }
                  }}
                >
                  <span css={styles.suggestionIcon}>
                    <PlusCircle size={16} aria-hidden="true" />
                  </span>
                  <span>{btnText}</span>
                </div>
                {suggestionArray.length > 0 && <Separator />}
              </>
            )}
            {suggestionArray.map((option, index) => (
              <div
                role="option"
                tabIndex={0}
                css={styles.suggestionItem}
                key={index}
                onClick={() => handleOptionClick(option)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOptionClick(option);
                  }
                }}
              >
                {option.leftIcon && (
                  <div css={styles.suggestionIcon}>{option.leftIcon}</div>
                )}
                <div css={styles.suggestionText}>{option.title}</div>
              </div>
            ))}
          </SuggestionDropdown>
        )}
      </div>
    );
  },
);

Searchbox.displayName = 'Searchbox';

export default Searchbox;

const styles = {
  root: scoped({
    width: '100%',
  }),
  inputWrap: scoped({
    position: 'relative',
    width: '100%',
  }),
  icon: scoped({
    ...flexCenter(),
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.colors.text.secondary,
  }),
  iconLeft: scoped({
    left: theme.spacing.lg,
    pointerEvents: 'none',
  }),
  iconRight: scoped({
    right: theme.spacing.lg,
    cursor: 'pointer',
  }),
  inputHasLeftIcon: scoped({
    paddingLeft: '36px',
  }),
  inputHasRightIcon: scoped({
    paddingRight: '36px',
  }),
  suggestionItem: scoped({
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
  suggestionIcon: scoped({
    minWidth: '16px',
    ...itemCenter(),
  }),
  suggestionText: scoped({
    ...itemCenter(),
    columnGap: theme.spacing.md,
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
};
