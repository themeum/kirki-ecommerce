import {
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import classNames from 'classnames';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
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
  selectWidth?: string | number;
};

const SelectInput = ({
  className,
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
  selectWidth,
}: SelectInputProps) => {
  const [inputValue, setInputValue] = useState<string | number>(
    value?.value || defaultValue?.value || '',
  );
  const [selectValue, setSelectValue] = useState<string>(
    String(value?.unit ?? defaultValue?.unit ?? ''),
  );

  const fallbackOption = optionsArray.find((item) => item?.fallback);
  const help = typeof error === 'string' ? error : helpText;

  useEffect(() => {
    setInputValue(value?.value ?? '');
    setSelectValue(String(value?.unit ?? ''));
  }, [value]);

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
      setSelectValue(String(unitValue?.value ?? fallbackOption!.value));
      return {
        value: parseFloat(match[1]),
        unit: unitValue?.value ?? fallbackOption!.value,
      };
    }

    if (/^-?\d*\.?\d+$/.test(rawValue)) {
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = separateUnitAndvalue(event.target.value);
    onChange(formattedValue);
  };

  const handleSelectChange = (nextValue: string) => {
    setSelectValue(nextValue);
    const matchedOption = optionsArray.find(
      (item) => String(item.value) === nextValue,
    );
    onChange({
      value: inputValue,
      unit: matchedOption ? matchedOption.value : nextValue,
    });
  };

  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label error={Boolean(error)} helpText={help}>
          {label}
        </Label>
      )}
      <Flex
        className={classNames(
          `${CLASS_PREFIX}-ui-select-input`,
          invisible && `${CLASS_PREFIX}-ui-select-input--invisible`,
          error && `${CLASS_PREFIX}-ui-select-input--error`,
          className,
        )}
        style={style}
      >
        <div style={{ flex: '1' }}>
          <Input
            type="number"
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            value={inputValue}
            step={step}
            max={max}
            min={min}
          />
        </div>
        <div style={{ width: selectWidth ? selectWidth : 'auto' }}>
          <Select value={selectValue} onValueChange={handleSelectChange}>
            <SelectTrigger error={Boolean(error)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {optionsArray.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Flex>
    </Flex>
  );
};

SelectInput.displayName = 'SelectInput';

export default SelectInput;
