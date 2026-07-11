import type { CSSProperties, RefObject } from 'react';
import { useState, useEffect } from 'react';
import classNames from 'classnames';

import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import { CLASS_PREFIX } from '@/conf';
import { Select } from '@/molecules/select';
import type { SelectOption } from '@/types';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type SelectInputProps = {
  className?: string;
  style?: CSSProperties;
  optionsArray?: SelectOption[];
  value?: SelectInputValue;
  defaultValue?: SelectInputValue;
  label?: string;
  helpText?: string;
  step?: number;
  max?: number;
  min?: number;
  error?: string | boolean;
  onChange?: (value: SelectInputValue) => void;
  invisible?: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  selectWidth?: string | number;
};

const SelectInput = ({
  className = '',
  style = {},
  optionsArray = [],
  value,
  defaultValue,
  label,
  helpText,
  step = 1,
  max,
  min,
  error,
  onChange = () => {},
  invisible,
  anchorRef,
  selectWidth,
}: SelectInputProps) => {
  const allClassNames = classNames(
    `${CLASS_PREFIX}-select-input-wrapper`,
    invisible && `${CLASS_PREFIX}-select-input-invisible`,
    error && `${CLASS_PREFIX}-error`,
    className,
  );

  const [inputValue, setInputValue] = useState<string | number>(
    value?.value || defaultValue?.value || '',
  );
  const [selectValue, setSelectValue] = useState<string | number>(
    value?.unit || defaultValue?.unit || '',
  );

  const fallbackOption = optionsArray.find((item) => item?.fallback);

  useEffect(() => {
    setInputValue(value?.value ?? '');
    setSelectValue(value?.unit ?? '');
  }, [value]);

  const handleInputChange = (nextValue: string | number) => {
    setInputValue(nextValue);
  };

  const handleInputBlur = (blurValue: string | number) => {
    const formattedValue = separateUnitAndvalue(String(blurValue));
    onChange(formattedValue);
  };
  const separateUnitAndvalue = (rawValue: string) => {
    const match = /^(-?\d*\.?\d+)\s*([a-zA-Z%]+)$/.exec(rawValue.trim());
    if (match) {
      let numericValue = parseFloat(match[1]);
      if (max !== undefined && numericValue > max) {
        numericValue = max;
      } else if (min !== undefined && numericValue < min) {
        numericValue = min;
      }
      setInputValue(numericValue);

      const unitValue = optionsArray.find(
        (item) => item.value === match[2].toLowerCase(),
      );
      setSelectValue(unitValue?.value || fallbackOption!.value);
      return {
        value: parseFloat(match[1]),
        unit: unitValue?.value || fallbackOption!.value,
      };
    } else if (/^-?\d*\.?\d+$/.test(rawValue)) {
      setInputValue(parseFloat(rawValue));
      return {
        value: parseFloat(rawValue),
        unit: selectValue,
      };
    }

    setInputValue(0);
    return {
      value: 0,
      unit: selectValue,
    };
  };
  const handleSelectChange = (nextValue: string | number) => {
    setSelectValue(nextValue);
    onChange({
      value: inputValue,
      unit: nextValue,
    });
  };
  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label
          text={label}
          type={error ? 'error' : ''}
          helpText={error ? error : helpText}
        />
      )}
      <Flex className={allClassNames} style={style}>
        <div style={{ flex: '1' }}>
          <Input
            onBlur={(blurValue) => handleInputBlur(blurValue)}
            onChange={(changeValue) => handleInputChange(changeValue)}
            value={inputValue}
            step={step}
            max={max}
            min={min}
          />
        </div>
        <div style={{ width: selectWidth ? selectWidth : 'auto' }}>
          <Select
            value={selectValue}
            optionsArray={optionsArray}
            onChange={(changeValue: string | number) =>
              handleSelectChange(changeValue)
            }
            anchorRef={anchorRef}
          />
        </div>
      </Flex>
    </Flex>
  );
};

export default SelectInput;
