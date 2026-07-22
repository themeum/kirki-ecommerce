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
import { PlusCircle, Search } from 'lucide-react';
import classNames from 'classnames';

import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SuggestionDropdown from '@/components/ui/suggestion-dropdown';
import { CLASS_PREFIX } from '@/conf';
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
  className?: string;
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
      className = '',
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
    const [searchValue, setSearchValue] = useState(value);

    useEffect(() => {
      setSearchValue(value);
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
      <div className={`${CLASS_PREFIX}-ui-searchbox`} style={style}>
        {label && (
          <Label
            error={Boolean(error)}
            helpText={typeof error === 'string' ? error : helpText}
          >
            {label}
          </Label>
        )}
        <div className={`${CLASS_PREFIX}-ui-searchbox-input-wrap`}>
          {resolvedLeftIcon && (
            <span
              className={`${CLASS_PREFIX}-ui-searchbox-icon ${CLASS_PREFIX}-ui-searchbox-icon--left`}
            >
              {resolvedLeftIcon}
            </span>
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
            className={classNames(
              Boolean(resolvedLeftIcon) &&
                `${CLASS_PREFIX}-ui-searchbox-input--has-left-icon`,
              Boolean(rightIcon || onClearInput) &&
                `${CLASS_PREFIX}-ui-searchbox-input--has-right-icon`,
              className,
            )}
            error={Boolean(error)}
            readOnly={readOnly}
            disabled={state === 'disabled'}
          />
          {onClearInput ? (
            <span
              className={`${CLASS_PREFIX}-ui-searchbox-icon ${CLASS_PREFIX}-ui-searchbox-icon--right`}
              onClick={onClearInput}
            >
              {rightIcon}
            </span>
          ) : (
            rightIcon && (
              <span
                className={`${CLASS_PREFIX}-ui-searchbox-icon ${CLASS_PREFIX}-ui-searchbox-icon--right`}
              >
                {rightIcon}
              </span>
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
                  className={`${CLASS_PREFIX}-ui-suggestion-item`}
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
                  <span className={`${CLASS_PREFIX}-ui-suggestion-icon`}>
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
                className={`${CLASS_PREFIX}-ui-suggestion-item`}
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
                  <div className={`${CLASS_PREFIX}-ui-suggestion-icon`}>
                    {option.leftIcon}
                  </div>
                )}
                <div className={`${CLASS_PREFIX}-ui-suggestion-text`}>
                  {option.title}
                </div>
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
