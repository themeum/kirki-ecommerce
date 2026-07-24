import type { SerializedStyles, Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';
import { getOverlayMotionStyles } from '@/theme/overlay-motion';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

type DropdownMenuSubTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>,
  'className'
> & {
  inset?: boolean;
  css?: SerializedStyles;
};

const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>((props, ref) => {
  const { css: cssProp, inset, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      css={[styles.item, inset && styles.itemInset, cssProp]}
      {...rest}
    >
      {children}
      <ChevronRight css={styles.chevron} size={16} aria-hidden="true" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

type DropdownMenuSubContentProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        css={[styles.content, styles.subContent, cssProp]}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

type DropdownMenuContentProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>((props, ref) => {
  const { css: cssProp, sideOffset = 4, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        css={[styles.content, styles.contentWidth, cssProp]}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

type DropdownMenuItemProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
  'className'
> & {
  inset?: boolean;
  css?: SerializedStyles;
};

const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>((props, ref) => {
  const { css: cssProp, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      css={[styles.item, inset && styles.itemInset, cssProp]}
      {...rest}
    />
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

type DropdownMenuCheckboxItemProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>((props, ref) => {
  const { css: cssProp, children, checked, ...rest } = props;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      css={[styles.item, styles.checkboxOrRadioItem, cssProp]}
      checked={checked}
      {...rest}
    >
      <span css={styles.itemIndicator}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={16} aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

type DropdownMenuRadioItemProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>((props, ref) => {
  const { css: cssProp, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      css={[styles.item, styles.checkboxOrRadioItem, cssProp]}
      {...rest}
    >
      <span css={styles.itemIndicator}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle
            size={8}
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

type DropdownMenuLabelProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>,
  'className'
> & {
  inset?: boolean;
  css?: SerializedStyles;
};

const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>((props, ref) => {
  const { css: cssProp, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      css={[styles.label, inset && styles.itemInset, cssProp]}
      {...rest}
    />
  );
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

type DropdownMenuSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      css={[styles.separator, cssProp]}
      {...rest}
    />
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

type DropdownMenuShortcutProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'className'
> & {
  css?: SerializedStyles;
};

const DropdownMenuShortcut = (props: DropdownMenuShortcutProps) => {
  const { css: cssProp, ...rest } = props;

  return <span css={[styles.shortcut, cssProp]} {...rest} />;
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

const styles = {
  content: scoped({
    minWidth: '128px',
    padding: `${theme.spacing[1]} 0`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    boxShadow: theme.shadow.md,
    maxHeight: '424px',
    overflowX: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box',
    color: theme.colors.text.primary,
    ...fontGeneralSettings(theme as Theme),
    ...getOverlayMotionStyles(
      'var(--radix-dropdown-menu-content-transform-origin)',
    ),
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  }),
  contentWidth: scoped({
    width: '256px',
  }),
  subContent: scoped({
    width: 'max-content',
    minWidth: '160px',
    maxWidth: '256px',
  }),
  item: scoped({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    margin: `0 ${theme.spacing[1]}`,
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    height: '32px',
    boxSizing: 'border-box',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    outline: 'none',
    color: theme.colors.text.primary,
    ...fontGeneralSettings(theme as Theme),
    fontSize: '14px',
    lineHeight: '20px',
    userSelect: 'none',
    '&:hover, &[data-highlighted]': {
      backgroundColor: '#f4f4f5',
    },
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
      color: theme.colors.text.disabled,
    },
    '&[data-state="open"]': {
      backgroundColor: '#f4f4f5',
    },
  }),
  itemInset: scoped({
    paddingLeft: theme.spacing[8],
  }),
  checkboxOrRadioItem: scoped({
    paddingLeft: `calc(${theme.spacing[2]} + ${theme.spacing[4]} + ${theme.spacing[2]})`,
  }),
  itemIndicator: scoped({
    position: 'absolute',
    left: theme.spacing[2],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    width: '16px',
    height: '16px',
    color: theme.colors.icon.primary,
  }),
  chevron: scoped({
    marginLeft: 'auto',
    flexShrink: 0,
    color: theme.colors.icon.secondary,
  }),
  label: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    margin: `0 ${theme.spacing[1]}`,
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.primary,
    pointerEvents: 'none',
  }),
  separator: scoped({
    height: '1px',
    backgroundColor: theme.colors.border.default,
    margin: `${theme.spacing[1]} 0`,
    border: 'none',
  }),
  shortcut: scoped({
    marginLeft: 'auto',
    paddingLeft: theme.spacing[4],
    fontSize: '12px',
    lineHeight: '16px',
    letterSpacing: '0.1px',
    color: '#71717a',
  }),
};
