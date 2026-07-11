import type { ReactNode, CSSProperties, MouseEvent, ChangeEvent } from 'react';
import { useState, useEffect } from 'react';

import { CheckboxChecked, CheckboxExcluded, CheckboxUnchecked } from '@/icons';
import Label from '@/molecules/label';
import { CLASS_PREFIX } from '@/conf';

type CheckboxProps = {
  onChange?: (value: boolean) => void;
  isPartialChecked?: boolean;
  leftIcon?: ReactNode;
  value?: boolean;
  label?: string;
  helpText?: string;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
};

const Checkbox = ({
  onChange,
  isPartialChecked = false,
  leftIcon = '',
  value = false,
  label = '',
  helpText,
  style,
  labelStyle = {},
}: CheckboxProps) => {
  const [checkboxChecked, setCheckboxChecked] = useState(value);
  useEffect(() => {
    setCheckboxChecked(value);
  }, [value]);
  const handleOnCheckboxClick = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newValue = !checkboxChecked;
    setCheckboxChecked((prev) => !prev);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleCompClick = (e: MouseEvent) => {
    e.stopPropagation();
  };
  return (
    <label
      style={style}
      className={`${CLASS_PREFIX}-checkbox-wrapper`}
      onClick={handleCompClick}
    >
      <span className={`${CLASS_PREFIX}-checkbox-icon`}>
        <input
          style={{ display: 'none' }}
          type="checkbox"
          checked={checkboxChecked}
          onChange={handleOnCheckboxClick}
        />
        {isPartialChecked ? (
          <CheckboxExcluded />
        ) : checkboxChecked ? (
          <CheckboxChecked />
        ) : (
          <CheckboxUnchecked />
        )}
      </span>
      {leftIcon && <span>{leftIcon}</span>}
      {label && <Label style={labelStyle} text={label} helpText={helpText} />}
    </label>
  );
};

export default Checkbox;
