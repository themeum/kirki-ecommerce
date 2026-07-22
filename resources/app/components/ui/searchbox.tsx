import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { PlusCircle, Search } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import SuggestionDropdown from '@/components/ui/suggestion-dropdown';
import { CLASS_PREFIX } from '@/conf';
import Input from '@/molecules/input';
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

const Searchbox = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  SearchboxProps
>((props, ref) => {
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

  const fallbackRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const triggerRef =
    (ref as RefObject<HTMLInputElement | HTMLTextAreaElement | null>) ||
    fallbackRef;
  const [openSuggestionDropdown, setOpenSuggestionDropDown] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const debouncedOnChange = useRef(debounce(onChange, 300)).current;

  const handleSearchChange = (nextValue: string | number) => {
    setSearchValue(String(nextValue));
    debouncedOnChange(nextValue);
  };

  const handleOptionClick = (option: SearchSuggestionOption) => {
    setOpenSuggestionDropDown(false);
    onOptionClick(option);
  };

  return (
    <>
      <Input
        type={searchValue ? 'text' : 'search'}
        label={label}
        helpText={helpText}
        ref={triggerRef}
        onChange={handleSearchChange}
        onBlur={onBlur}
        value={searchValue}
        placeholder={placeholder}
        onClick={() => {
          setOpenSuggestionDropDown(true);
          onClick();
        }}
        onEnter={(enterValue) => {
          setOpenSuggestionDropDown(false);
          onEnter(enterValue);
        }}
        leftIcon={
          leftIcon ? leftIcon : !hasIcon ? null : <Search size={16} aria-hidden="true" />
        }
        rightIcon={rightIcon}
        className={className}
        style={style}
        state={state}
        error={error}
        readOnly={readOnly}
        onClearInput={onClearInput}
      />
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
                  onNewOptionAdd(
                    (triggerRef.current as HTMLInputElement | null)?.value ??
                      '',
                  );
                  setOpenSuggestionDropDown(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onNewOptionAdd(
                      (triggerRef.current as HTMLInputElement | null)?.value ??
                        '',
                    );
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
    </>
  );
});

Searchbox.displayName = 'Searchbox';

export default Searchbox;
