import { type CSSObject } from '@emotion/react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import type { ComponentRef } from 'react';
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useId,
} from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';

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
  cssOverride?: CSSObject;
};

const Checkbox = forwardRef<ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  (props, ref) => {
    const {
      cssOverride,
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

    const resolvedChecked = isPartialChecked ? 'indeterminate' : (checked ?? value ?? false);

    const isIndeterminate = resolvedChecked === 'indeterminate';

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
        css={scopedMerge(styles.checkbox, cssOverride)}
        checked={resolvedChecked}
        onCheckedChange={handleCheckedChange}
        onClick={handleRootClick}
        style={label || leftIcon ? undefined : style}
        {...rest}
      >
        <CheckboxPrimitive.Indicator css={scoped(styles.indicator)}>
          {isIndeterminate ? (
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
      <Field orientation="horizontal" style={style} onClick={handleWrapperClick}>
        {control}
        {leftIcon && <span>{leftIcon}</span>}
        {label && (
          <FieldLabel htmlFor={checkboxId} style={labelStyle}>
            {label}
          </FieldLabel>
        )}
      </Field>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

const styles = defineStyles({
  checkbox: {
    ...flexCenter(),
    width: '16px',
    height: '16px',
    minWidth: '16px',
    minHeight: '16px',
    flexShrink: 0,
    alignSelf: 'center',
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    lineHeight: 0,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.background.surfaceTertiary,
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '&[data-state="checked"], &[data-state="indeterminate"]': {
      backgroundColor: theme.colors.background.fillBrand,
      borderColor: theme.colors.background.fillBrand,
    },
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
      backgroundColor: theme.colors.background.fillDisabled,
      borderColor: theme.colors.border.disabled,
    },
  },
  indicator: {
    ...flexCenter(),
    display: 'flex',
    color: theme.colors.background.surfaceTertiary,
  },
});
