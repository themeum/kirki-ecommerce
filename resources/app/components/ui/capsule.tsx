import { useMemo } from 'react';
import { Minus } from 'lucide-react';
import classNames from 'classnames';

import Button from '@/components/ui/button';
import Combobox from '@/components/ui/combobox';
import { CLASS_PREFIX } from '@/conf';
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
  className?: string;
};

const toStringValue = (value?: CapsuleValue) =>
  value === undefined || value === null ? '' : String(value);

const Capsule = ({
  optionsArray,
  value,
  onClearItem = () => {},
  onValueChange = () => [],
  uniqueKey,
  multiple,
  className,
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

  const handleChange = (nextValue: string | string[]) => {
    if (Array.isArray(nextValue)) {
      onValueChange(nextValue.map(resolveOriginalValue));
      return;
    }
    onValueChange(resolveOriginalValue(nextValue));
  };

  return (
    <div
      className={classNames(`${CLASS_PREFIX}-ui-capsule`, className)}
      key={uniqueKey}
    >
      <Combobox
        options={options}
        value={comboboxValue}
        onChange={handleChange}
        multiple={multiple}
        className={`${CLASS_PREFIX}-ui-capsule-combobox`}
      />
      <div
        className={`${CLASS_PREFIX}-ui-capsule-separator`}
        aria-hidden="true"
      />
      <Button
        variant="ghost"
        size="sm"
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
