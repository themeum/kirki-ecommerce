import type { KeyboardEvent } from 'react';
import { useState, useEffect } from 'react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

type ColorPickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string | boolean;
  placeholder?: string;
  helpText?: string;
};

const ColorPicker = ({
  value,
  onChange,
  label,
  error,
  placeholder,
  helpText,
}: ColorPickerProps) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const validateInputColor = (colorValue: string) => {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorValue);
  };

  const handleChange = (val: string) => {
    setInputValue(val);

    if (validateInputColor(val)) {
      onChange?.(val);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (validateInputColor(inputValue)) {
        onChange?.(inputValue);
      }
    }
  };

  const handleSwatchToggle = () => {
    setOpen(!open);
  };

  const handleSwatchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSwatchToggle();
    }
  };

  return (
    <Flex direction="column" gap={8}>
      {label && (
        <Label error={Boolean(error)} helpText={error ? error : helpText}>
          {label}
        </Label>
      )}
      <div className={`${CLASS_PREFIX}-color-picker-wrapper`}>
        <div className={`${CLASS_PREFIX}-color-picker-inner`}>
          <div
            role="button"
            tabIndex={0}
            aria-label={__('Toggle color picker', 'kirki-ecommerce')}
            className={`${CLASS_PREFIX}-color-picker-swatch`}
            style={{ backgroundColor: inputValue || placeholder }}
            onClick={handleSwatchToggle}
            onKeyDown={handleSwatchKeyDown}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={classNames(`${CLASS_PREFIX}-color-picker-input`)}
            placeholder={placeholder}
            aria-invalid={Boolean(error) || undefined}
          />
        </div>
      </div>
    </Flex>
  );
};

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
