import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> & {
  error?: boolean;
};

const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>((props, ref) => {
  const { className, children, error, ...rest } = props;

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-error={error ? 'true' : undefined}
      className={classNames(
        `${CLASS_PREFIX}-ui-select-trigger`,
        error && `${CLASS_PREFIX}-ui-select-trigger--error`,
        className,
      )}
      {...rest}
    >
      <span className={`${CLASS_PREFIX}-ui-select-value`}>{children}</span>
      <SelectPrimitive.Icon asChild>
        <span className={`${CLASS_PREFIX}-ui-select-chevron`}>
          <ChevronDownIcon width={16} height={16} />
        </span>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>((props, ref) => {
  const { className, children, position = 'popper', ...rest } = props;

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={classNames(`${CLASS_PREFIX}-ui-select-content`, className)}
        {...rest}
      >
        <SelectPrimitive.Viewport
          className={`${CLASS_PREFIX}-ui-select-viewport`}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

SelectContent.displayName = 'SelectContent';

const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Label
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-select-label`, className)}
      {...rest}
    />
  );
});

SelectLabel.displayName = 'SelectLabel';

const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>((props, ref) => {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-select-item`, className)}
      {...rest}
    >
      <span className={`${CLASS_PREFIX}-ui-select-item-indicator`}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon width={16} height={16} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

SelectItem.displayName = 'SelectItem';

const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-select-separator`, className)}
      {...rest}
    />
  );
});

SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
