import { useState, useEffect, type MouseEvent } from 'react';

import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import type { LabelFieldProps, SelectOption, StyleProps } from '@/types';

import RadioItem from '@/molecules/radio-group/radio-item';

type RadioItemType = 'checked' | 'tick';

type RadioGroupProps = StyleProps &
  LabelFieldProps & {
    defaultValue?: string | number;
    optionsArray?: SelectOption[];
    onChange?: (value: string | number) => void;
    type?: RadioItemType;
    value?: string | number;
  };

const RadioGroup = (props: RadioGroupProps) => {
  const {
    style = {},
    className = '',
    defaultValue = '',
    optionsArray = [],
    onChange = () => {},
    type,
    value,
    label,
    helpText,
  } = props;

  const [selectedItem, setSelectedItem] = useState<string | number | undefined>(
    value || defaultValue,
  );

  useEffect(() => {
    setSelectedItem(value);
  }, [value]);

  const handleRadioItemClick = (
    _e: MouseEvent,
    itemValue: string | number,
  ) => {
    setSelectedItem(itemValue);
    onChange(itemValue);
  };
  return (
    <Flex
      direction="column"
      gap={8}
      className={`${CLASS_PREFIX}-radio-group ${className}`}
      style={style}
    >
      {label && <Label text={label} helpText={helpText} />}
      {optionsArray.map((item, index) => (
        <Flex key={index} gap={8}>
          <RadioItem
            value={item.value}
            onChange={(e) => handleRadioItemClick(e, item.value)}
            isSelected={item.value === selectedItem}
            type={type}
          />
          <div
            onClick={(e) => handleRadioItemClick(e, item.value)}
            className={`${CLASS_PREFIX}-radio-item`}
          >
            <Label text={item.title} />
          </div>
        </Flex>
      ))}
    </Flex>
  );
};

export default RadioGroup;
