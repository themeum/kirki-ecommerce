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
import classNames from 'classnames';

import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'value' | 'onChange'
> & {
  value?: boolean;
  onChange?: (value: boolean) => void;
  isPartialChecked?: boolean;
  leftIcon?: ReactNode;
  label?: string;
  helpText?: string;
  labelStyle?: CSSProperties;
};

const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>((props, ref) => {
  const {
    className,
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
      className={classNames(`${CLASS_PREFIX}-ui-checkbox`, className)}
      checked={resolvedChecked}
      onCheckedChange={handleCheckedChange}
      onClick={handleRootClick}
      style={label ? undefined : style}
      {...rest}
    >
      <CheckboxPrimitive.Indicator
        className={`${CLASS_PREFIX}-ui-checkbox-indicator`}
      >
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
    <label
      style={style}
      className={`${CLASS_PREFIX}-ui-checkbox-wrapper`}
      onClick={handleWrapperClick}
    >
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
