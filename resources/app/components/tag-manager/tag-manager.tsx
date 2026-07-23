import { useState, useEffect, useRef, type ReactNode } from 'react';
import { css, type SerializedStyles } from '@emotion/react';
import { Minus, PlusCircle, Trash2 } from 'lucide-react';

import SelectedTags from '@/components/tag-manager/selected-tags';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import Searchbox from '@/components/ui/searchbox';
import { Separator } from '@/components/ui/separator';
import SuggestionDropdown, {
  suggestionIconStyle,
  suggestionItemStyle,
  suggestionTextStyle,
} from '@/components/ui/suggestion-dropdown';
import Tag from '@/components/ui/tag';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { LabelFieldProps, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type TagOption = SelectOption & {
  leftIcon?: ReactNode;
};

type TagManagerType = 'default' | 'list';

type TagManagerProps = LabelFieldProps & {
  css?: SerializedStyles;
  showInputField?: boolean;
  selectedTags?: TagOption[];
  suggestions?: TagOption[];
  value?: string;
  searchKey?: string | number;
  placeholder?: string;
  onTagAdd?: (tag: TagOption) => void;
  onNewTagAdd?: (tagTitle: string) => void;
  onTagRemove?: (tag: TagOption) => void;
  onSearchChange?: (value: string) => void;
  onClick?: () => void;
  onBlur?: () => void;
  type?: TagManagerType;
  leftIcon?: ReactNode;
  hasSearchIcon?: boolean;
  btnText?: string;
  hasAddBtn?: boolean;
  showSuggestionDropdown?: boolean;
  readOnly?: boolean;
  showRemoveIcon?: boolean;
};

const TagManager = (props: TagManagerProps) => {
  const {
    showInputField = true,
    selectedTags = [],
    suggestions = [],
    label,
    value,
    searchKey,
    helpText,
    placeholder = __('Type to add tags..', 'kirki-ecommerce'),
    onTagAdd = () => {},
    onNewTagAdd = () => {},
    onTagRemove = () => {},
    onSearchChange = () => {},
    onClick = () => {},
    onBlur = () => {},
    css: cssProp,
    type = 'default',
    leftIcon,
    hasSearchIcon,
    error,
    btnText = __('Add Tag', 'kirki-ecommerce'),
    hasAddBtn = true,
    showSuggestionDropdown = true,
    readOnly = false,
    showRemoveIcon = true,
  } = props;

  const [openSuggestionDropdown, setOpenSuggestionDropDown] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>('');
  const triggerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleOptionClick = (tag: TagOption) => {
    onTagAdd(tag);
    setInputValue('');
    setOpenSuggestionDropDown(false);
  };

  const handleOnEnterPress = (tagTitle: string) => {
    onNewTagAdd(tagTitle);
    handleSearchChange('');
    setOpenSuggestionDropDown(false);
  };

  const handleNewTagAdd = (title: string) => {
    onNewTagAdd(title);
    handleSearchChange('');
    setOpenSuggestionDropDown(false);
  };

  const handleSearchChange = (nextValue: string) => {
    setInputValue(nextValue);
    onSearchChange(nextValue);
  };

  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label error={Boolean(error)} helpText={error ? error : helpText}>
          {label}
        </Label>
      )}
      <div css={[styles.shell, type === 'list' && styles.list, cssProp]}>
        {showInputField && (
          <>
            {type === 'default' && (
              <Searchbox
                ref={triggerRef}
                key={searchKey}
                value={inputValue}
                placeholder={placeholder}
                css={css([
                  styles.input,
                  selectedTags.length > 0 && styles.inputBorderNone,
                ])}
                onChange={(nextValue) =>
                  handleSearchChange(String(nextValue))
                }
                onBlur={onBlur}
                onEnter={(title) => handleOnEnterPress(String(title))}
                onClick={() => {
                  setOpenSuggestionDropDown(
                    hasAddBtn || suggestions.length > 0,
                  );
                  onClick();
                }}
                leftIcon={leftIcon}
                hasIcon={hasSearchIcon}
                readOnly={readOnly}
              />
            )}
            {showSuggestionDropdown && (
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
                      css={suggestionItemStyle}
                      onClick={() => {
                        handleNewTagAdd(triggerRef.current!.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleNewTagAdd(triggerRef.current!.value);
                        }
                      }}
                    >
                      <span css={suggestionIconStyle}>
                        <PlusCircle size={16} aria-hidden="true" />
                      </span>
                      <span>{btnText}</span>
                    </div>
                    {suggestions.length > 0 && <Separator />}
                  </>
                )}
                {suggestions.map((option, key) => (
                  <div
                    role="option"
                    tabIndex={0}
                    css={suggestionItemStyle}
                    key={key}
                    onClick={() => handleOptionClick(option)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOptionClick(option);
                      }
                    }}
                  >
                    {option?.leftIcon && (
                      <div css={suggestionIconStyle}>{option.leftIcon}</div>
                    )}
                    {option?.color && (
                      <div
                        css={styles.swatch}
                        style={{ background: option?.color }}
                        aria-hidden="true"
                      />
                    )}
                    <div css={suggestionTextStyle}>{option.title}</div>
                  </div>
                ))}
              </SuggestionDropdown>
            )}
          </>
        )}
        {type === 'list' ? (
          <Flex direction="column">
            {selectedTags.map((item, index) => (
              <div key={index}>
                <Flex style={{ alignItems: 'center', padding: '12px' }} gap={8}>
                  {item?.color && (
                    <div
                      css={styles.swatch}
                      style={{ background: item?.color }}
                      aria-hidden="true"
                    />
                  )}
                  <Text
                    header={item.title}
                    type="xsm"
                    style={{ fontWeight: '500' }}
                  />
                  <ActionGroup>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onTagRemove(item)}
                      aria-label={__('Remove tag', 'kirki-ecommerce')}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </ActionGroup>
                </Flex>
                <Separator style={{ margin: '0' }} />
              </div>
            ))}
            {showInputField && (
              <Searchbox
                ref={triggerRef}
                value={inputValue}
                key={searchKey}
                placeholder={placeholder}
                onBlur={onBlur}
                css={styles.input}
                onChange={(nextValue) =>
                  handleSearchChange(String(nextValue))
                }
                onEnter={(title) => handleOnEnterPress(String(title))}
                onClick={() => {
                  setOpenSuggestionDropDown(true);
                  onClick();
                }}
                leftIcon={leftIcon}
              />
            )}
          </Flex>
        ) : (
          <>
            {selectedTags.length > 0 ? (
              <SelectedTags hasBorderRadius={!showInputField}>
                {selectedTags.map((tag, index) => (
                  <Tag
                    text={tag.title}
                    img={tag.tagIcon}
                    subText={tag?.subText}
                    key={index}
                    onTagRemove={() => onTagRemove(tag)}
                    closeIcon={
                      showRemoveIcon ? (
                        <Minus size={14} aria-hidden="true" />
                      ) : undefined
                    }
                    color={tag?.color}
                  />
                ))}
              </SelectedTags>
            ) : null}
          </>
        )}
      </div>
    </Flex>
  );
};

TagManager.displayName = 'TagManager';

export default TagManager;

const styles = {
  shell: scoped({
    overflow: 'hidden',
  }),
  list: scoped({
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
  }),
  swatch: scoped({
    height: '16px',
    width: '16px',
    borderRadius: theme.radius.full,
    flexShrink: 0,
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
};
