import { css, type CSSObject } from '@emotion/react';
import { type ChangeEvent, type CSSProperties, useEffect, useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { SelectOption } from '@/types';
import { noop } from '@/utils/function';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type SelectInputProps = {
  style?: CSSProperties;
  cssOverride?: CSSObject;
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
  style = {},
  cssOverride,
  optionsArray = [],
  value,
  defaultValue,
  label,
  helpText,
  step = 1,
  max,
  min,
  error,
  onChange = noop,
  invisible,
  selectWidth,
}: SelectInputProps) => {
  const [inputValue, setInputValue] = useState<string | number>(
    value?.value ?? defaultValue?.value ?? '',
  );
  const [selectValue, setSelectValue] = useState<string>(
    String(value?.unit ?? defaultValue?.unit ?? ''),
  );

  const fallbackOption = optionsArray.find((item) => item?.fallback);

  useEffect(() => {
    if (value === undefined) {
      return;
    }
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
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Flex
        cssOverride={mergeCss(styles.wrapper,
          invisible && styles.wrapperInvisible,
          error && styles.wrapperError,
          cssOverride)}
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
            cssOverride={styles.input}
            aria-invalid={Boolean(error) || undefined}
          />
        </div>
        <div style={{ width: selectWidth ? selectWidth : 'auto' }}>
          <Select value={selectValue} onValueChange={handleSelectChange}>
            <SelectTrigger
              error={Boolean(error)}
              cssOverride={invisible ? styles.selectTrigger : styles.selectTriggerDivider}
            >
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
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

SelectInput.displayName = 'SelectInput';

export default SelectInput;

const styles = defineStyles({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
    overflow: 'hidden',
  },
  wrapperInvisible: {
    borderColor: 'transparent',
    boxShadow: 'none',
    height: '100%',
    outline: 'none',
  },
  wrapperError: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: `0px 0px 0px 1px ${theme.colors.background.fillCritical}`,
  },
  input: css({
    border: 'none',
    borderRadius: theme.radius.none,
    '&:focus, &:focus-visible, &:active': {
      boxShadow: 'none',
    },
  }),
  selectTrigger: css({
    border: 'none',
    boxShadow: 'none',
    borderRadius: theme.radius.none,
  }),
  selectTriggerDivider: css([
    {
      border: 'none',
      boxShadow: 'none',
      borderRadius: theme.radius.none,
    },
    {
      borderLeft: `1px solid ${theme.colors.border.default}`,
    },
  ]),
});
