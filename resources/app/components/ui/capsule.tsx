import type { SerializedStyles } from '@emotion/react';
import { Minus } from 'lucide-react';
import { useMemo } from 'react';

import Button from '@/components/ui/button';
import Combobox from '@/components/ui/combobox';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';
import type { SelectOption } from '@/types';

type CapsuleValue = string | number;
type CapsuleValueOrArray = CapsuleValue | CapsuleValue[];

type CapsuleProps = {
  optionsArray?: SelectOption[];
  value?: CapsuleValueOrArray;
  onClearItem?: () => void;
  onValueChange?: (value: CapsuleValueOrArray) => void;
  uniqueKey?: string | number;
  multiple?: boolean;
  css?: SerializedStyles;
};

const toStringValue = (value?: CapsuleValue) => {
  return value === undefined || value === null ? '' : String(value);
};

const Capsule = ({
  optionsArray,
  value,
  onClearItem = () => {},
  onValueChange = () => [],
  uniqueKey,
  multiple,
  css: cssProp,
}: CapsuleProps) => {
  const options = useMemo(
    () =>
      (optionsArray || [])
        .filter((option) => !option.heading)
        .map((option) => ({
          label: option.title,
          value: toStringValue(option.value),
        })),
    [optionsArray],
  );

  const resolveOriginalValue = (stringValue: string): CapsuleValue => {
    const option = optionsArray?.find(
      (item) => toStringValue(item.value) === stringValue,
    );
    return option ? option.value : stringValue;
  };

  const comboboxValue = multiple
    ? (Array.isArray(value) ? value : []).map(toStringValue)
    : toStringValue(Array.isArray(value) ? value[0] : value);

  /* No options to match against, so there is no label to resolve — print the
   * raw value instead of the combobox placeholder. */
  const isTextOnly = optionsArray === undefined;

  const displayValue = Array.isArray(value)
    ? value.map(toStringValue).filter(Boolean).join(', ')
    : toStringValue(value);

  const handleChange = (nextValue: string | string[]) => {
    if (Array.isArray(nextValue)) {
      onValueChange(nextValue.map(resolveOriginalValue));
      return;
    }
    onValueChange(resolveOriginalValue(nextValue));
  };

  return (
    <div css={[styles.root, cssProp]} key={uniqueKey}>
      {isTextOnly ? (
        <Text variant="small" title={displayValue} css={styles.textValue}>
          {displayValue}
        </Text>
      ) : (
        <Combobox
          options={options}
          value={comboboxValue}
          onChange={handleChange}
          multiple={multiple}
        />
      )}
      <div css={styles.separator} aria-hidden="true" />
      <Button
        variant="ghost"
        aria-label="Clear"
        onClick={onClearItem}
      >
        <Minus size={16} aria-hidden="true" />
      </Button>
    </div>
  );
};

Capsule.displayName = 'Capsule';

export default Capsule;

const styles = {
  root: scoped({
    minWidth: '126px',
    borderRadius: theme.radius.md,
    height: '32px',
    ...flexCenter(),
    backgroundColor: theme.colors.background.surfaceTertiary,
    '& > button[role="combobox"]': {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      height: '100%',
      minHeight: 0,
      '&:focus-visible, &[data-state="open"]': {
        borderColor: 'transparent',
        boxShadow: 'none',
      },
    },
  }),
  separator: scoped({
    height: '100%',
    width: '1px',
    backgroundColor: theme.colors.border.default,
  }),
  textValue: scoped({
    flex: 1,
    minWidth: 0,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
};
