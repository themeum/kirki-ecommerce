import { type SerializedStyles, type Theme } from '@emotion/react';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';

import { Field, FieldLabel } from '@/components/ui/field';
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
    style,
    labelStyle,
    onClick,
    id,
    ...rest
  } = props;

  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const resolvedChecked = isPartialChecked
    ? 'indeterminate'
    : (checked ?? value ?? false);

  const handleCheckedChange = (next: boolean | 'indeterminate') => {
    const nextValue = next === true;
    onCheckedChange?.(next);
    onChange?.(nextValue);
  };

  const handleWrapperClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleRootClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  const control = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={label || leftIcon ? checkboxId : id}
      css={[styles.checkbox, cssProp]}
      checked={resolvedChecked}
      onCheckedChange={handleCheckedChange}
      onClick={handleRootClick}
      style={label || leftIcon ? undefined : style}
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
    <Field
      orientation="horizontal"
      style={style}
      onClick={handleWrapperClick}
    >
      {control}
      {leftIcon && <span>{leftIcon}</span>}
      {label && (
        <FieldLabel htmlFor={checkboxId} style={labelStyle}>
          {label}
        </FieldLabel>
      )}
    </Field>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;

const styles = {
  checkbox: scoped({
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.background.surfaceTertiary,
    boxSizing: 'border-box',
    '&:focus-visible': {
      ...uiFocusRing(theme as Theme),
    },
    '&[data-state="checked"], &[data-state="indeterminate"]': {
      backgroundColor: theme.colors.background.fillBrand,
      borderColor: theme.colors.background.fillBrand,
    },
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  indicator: scoped({
    ...flexCenter(),
    display: 'flex',
    color: theme.colors.background.surfaceTertiary,
  }),
};
