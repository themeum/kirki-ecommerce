import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

const Command = forwardRef<
  ElementRef<typeof CommandPrimitive>,
  ComponentPropsWithoutRef<typeof CommandPrimitive>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command`, className)}
      {...rest}
    />
  );
});

Command.displayName = 'Command';

const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <div className={`${CLASS_PREFIX}-ui-command-input-wrapper`}>
      <Search size={16} className={`${CLASS_PREFIX}-ui-command-search-icon`} />
      <CommandPrimitive.Input
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-command-input`, className)}
        {...rest}
      />
    </div>
  );
});

CommandInput.displayName = 'CommandInput';

const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.List
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command-list`, className)}
      {...rest}
    />
  );
});

CommandList.displayName = 'CommandList';

const CommandEmpty = forwardRef<
  ElementRef<typeof CommandPrimitive.Empty>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command-empty`, className)}
      {...rest}
    />
  );
});

CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = forwardRef<
  ElementRef<typeof CommandPrimitive.Group>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Group
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command-group`, className)}
      {...rest}
    />
  );
});

CommandGroup.displayName = 'CommandGroup';

const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Item
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command-item`, className)}
      {...rest}
    />
  );
});

CommandItem.displayName = 'CommandItem';

const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-command-separator`, className)}
      {...rest}
    />
  );
});

CommandSeparator.displayName = 'CommandSeparator';

const CommandShortcut = (props: HTMLAttributes<HTMLSpanElement>) => {
  const { className, ...rest } = props;

  return (
    <span
      className={classNames(`${CLASS_PREFIX}-ui-command-shortcut`, className)}
      {...rest}
    />
  );
};

CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
