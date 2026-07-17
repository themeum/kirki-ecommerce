import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import { getPortalContainer } from '@/libs/portal-container';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>((props, ref) => {
  const { className, inset, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-sub-trigger`,
        inset && `${CLASS_PREFIX}-ui-dropdown-menu-item--inset`,
        className,
      )}
      {...rest}
    >
      {children}
      <ChevronRight
        size={16}
        className={`${CLASS_PREFIX}-ui-dropdown-menu-chevron`}
        aria-hidden="true"
      />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-dropdown-menu-sub-content`,
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>((props, ref) => {
  const { className, sideOffset = 4, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={classNames(
          `${CLASS_PREFIX}-ui-dropdown-menu-content`,
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>((props, ref) => {
  const { className, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-item`,
        inset && `${CLASS_PREFIX}-ui-dropdown-menu-item--inset`,
        className,
      )}
      {...rest}
    />
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>((props, ref) => {
  const { className, children, checked, ...rest } = props;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-checkbox-item`,
        className,
      )}
      checked={checked}
      {...rest}
    >
      <span className={`${CLASS_PREFIX}-ui-dropdown-menu-item-indicator`}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={16} aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>((props, ref) => {
  const { className, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-radio-item`,
        className,
      )}
      {...rest}
    >
      <span className={`${CLASS_PREFIX}-ui-dropdown-menu-item-indicator`}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle size={8} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>((props, ref) => {
  const { className, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-label`,
        inset && `${CLASS_PREFIX}-ui-dropdown-menu-item--inset`,
        className,
      )}
      {...rest}
    />
  );
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-separator`,
        className,
      )}
      {...rest}
    />
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = (props: HTMLAttributes<HTMLSpanElement>) => {
  const { className, ...rest } = props;

  return (
    <span
      className={classNames(
        `${CLASS_PREFIX}-ui-dropdown-menu-shortcut`,
        className,
      )}
      {...rest}
    />
  );
};

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
