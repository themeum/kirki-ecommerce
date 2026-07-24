import { type SerializedStyles, type Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';

import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { flexCenter, scoped, uiFocusRing } from '@/theme/mixins';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'value' | 'onChange' | 'className' | 'css'
> & {
  value?: boolean;
  onChange?: (value: boolean) => void;
  isPartialChecked?: boolean;
  leftIcon?: ReactNode;
  label?: string;
  helpText?: string;
  labelStyle?: CSSProperties;
  css?: SerializedStyles;
};

const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>((props, ref) => {
  const {
    css: cssProp,
    checked,
    value,
    onCheckedChange,
    onChange,
    isPartialChecked = false,
    leftIcon,
    label,
    helpText,
    style,
    labelStyle,
    onClick,
    ...rest
  } = props;

  const resolvedChecked = isPartialChecked
    ? 'indeterminate'
    : (checked ?? value ?? false);

  const handleCheckedChange = (next: boolean | 'indeterminate') => {
    const nextValue = next === true;
    onCheckedChange?.(next);
    onChange?.(nextValue);
  };

  const handleWrapperClick = (event: MouseEvent<HTMLLabelElement>) => {
    event.stopPropagation();
  };

  const handleRootClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      css={[styles.checkbox, cssProp]}
      checked={resolvedChecked}
      onCheckedChange={handleCheckedChange}
      onClick={handleRootClick}
      style={label ? undefined : style}
      {...rest}
    >
      <CheckboxPrimitive.Indicator css={styles.indicator}>
        {isPartialChecked ? (
          <Minus size={12} strokeWidth={3} />
        ) : (
          <Check size={12} strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label && !leftIcon) {
    return control;
  }

  return (
    <label css={styles.wrapper} style={style} onClick={handleWrapperClick}>
      {control}
      {leftIcon && <span>{leftIcon}</span>}
      {label && (
        <Label style={labelStyle} helpText={helpText}>
          {label}
        </Label>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;

const styles = {
  wrapper: scoped({
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    cursor: 'pointer',
  }),
  checkbox: scoped({
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: '1px solid #e4e3ea',
    borderRadius: theme.radius.sm,
    backgroundColor: '#ffffff',
    color: '#f3f3f7',
    boxSizing: 'border-box',
    '&:focus-visible': {
      ...uiFocusRing(theme as Theme),
    },
    '&[data-state="checked"], &[data-state="indeterminate"]': {
      backgroundColor: '#5641f3',
      borderColor: '#5641f3',
    },
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  indicator: scoped({
    ...flexCenter(),
    display: 'flex',
    color: '#f3f3f7',
  }),
};
