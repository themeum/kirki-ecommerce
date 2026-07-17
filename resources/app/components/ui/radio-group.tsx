import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-radio-group`, className)}
      {...rest}
    />
  );
});

RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-radio-item`, className)}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator
        className={`${CLASS_PREFIX}-ui-radio-indicator`}
      >
        <Circle size={8} fill="currentColor" strokeWidth={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
