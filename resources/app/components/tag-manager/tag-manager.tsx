import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';

import Suggestions from '@/components/ui/suggestions';
import type { LabelFieldProps, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type TagOption = SelectOption & {
  leftIcon?: ReactNode;
};

type TagManagerProps = LabelFieldProps & {
  css?: SerializedStyles;
  selectedTags?: TagOption[];
  suggestions?: TagOption[];
  value?: string;
  placeholder?: string;
  onTagAdd?: (tag: TagOption) => void;
  onNewTagAdd?: (tagTitle: string) => void;
  onTagRemove?: (tag: TagOption) => void;
  onSearchChange?: (value: string) => void;
  onClick?: () => void;
  addItemLabel?: string;
  hasAddBtn?: boolean;
  readOnly?: boolean;
};

/**
 * Tag entry field wrapping Suggestions for multi-select chip entry.
 *
 * @param props Component props.
 *
 * @returns Tag manager element.
 * @since 1.0.0
 */
const TagManager = (props: TagManagerProps) => {
  const {
    selectedTags = [],
    suggestions = [],
    label,
    value,
    helpText,
    placeholder = __('Type to add tags..', 'kirki-ecommerce'),
    onTagAdd = () => {},
    onNewTagAdd = () => {},
    onTagRemove = () => {},
    onSearchChange = () => {},
    onClick = () => {},
    css: cssProp,
    error,
    addItemLabel = __('Add Tag', 'kirki-ecommerce'),
    hasAddBtn = true,
    readOnly = false,
  } = props;

  return (
    <Suggestions
      css={cssProp}
      label={label}
      helpText={helpText}
      error={error}
      placeholder={placeholder}
      suggestions={suggestions}
      selectedItems={selectedTags}
      value={value}
      addItemLabel={addItemLabel}
      hasAddBtn={hasAddBtn}
      readOnly={readOnly}
      onSelect={onTagAdd}
      onRemove={onTagRemove}
      onAddItem={onNewTagAdd}
      onSearchChange={onSearchChange}
      onClick={onClick}
    />
  );
};

TagManager.displayName = 'TagManager';

export default TagManager;
export type { TagOption, TagManagerProps };
