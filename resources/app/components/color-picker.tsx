import type { KeyboardEvent } from 'react';
import { useState, useEffect } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { theme } from '@/theme';
import { itemCenter, scoped, defineStyles } from '@/theme/mixins';
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
  const [inputValue, setInputValue] = useState(value ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value ?? '');
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
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div css={scoped(styles.wrapper)}>
        <div css={scoped(styles.inner)}>
          <div
            role="button"
            tabIndex={0}
            aria-label={__('Toggle color picker', 'kirki-ecommerce')}
            css={scoped(styles.swatch)}
            style={{ backgroundColor: inputValue || placeholder }}
            onClick={handleSwatchToggle}
            onKeyDown={handleSwatchKeyDown}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            css={scoped(styles.input)}
            placeholder={placeholder}
            aria-invalid={Boolean(error) || undefined}
          />
        </div>
      </div>
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;

const styles = defineStyles({
  wrapper: {
    border: `1px solid ${theme.colors.border.alt}`,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    '&:focus-within': {
      boxShadow: `0px 0px 0px 1.5px ${theme.colors.border.ring}`,
    },
  },
  inner: {
    ...itemCenter(),
    gap: theme.spacing[2],
    width: '100%',
  },
  swatch: {
    backgroundColor: 'transparent',
    height: '16px',
    width: '16px',
    border: `1px solid ${theme.colors.border.alt}`,
    borderRadius: theme.radius.full,
    flexShrink: 0,
    cursor: 'pointer',
  },
  input: {
    border: 'none !important',
    outline: 'none !important',
    flex: '1 !important',
    padding: `${theme.spacing[0]} !important`,
    '&:focus, &:focus-visible, &:active': {
      border: 'none !important',
      outline: 'none !important',
      boxShadow: 'none !important',
    },
  },
});
