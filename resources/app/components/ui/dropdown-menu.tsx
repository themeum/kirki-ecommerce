import type { CSSObject } from '@emotion/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import type { ComponentRef} from 'react';
import { type ComponentPropsWithoutRef, forwardRef, type HTMLAttributes } from 'react';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
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
  cssOverride?: CSSObject;
};

const DropdownMenuSubTrigger = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>((props, ref) => {
  const { cssOverride, inset, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      css={scopedMerge(styles.item, inset && styles.itemInset, cssOverride)}
      {...rest}
    >
      {children}
      <ChevronRight css={scoped(styles.chevron)} size={16} aria-hidden="true" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

type DropdownMenuSubContentProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DropdownMenuSubContent = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        css={scopedMerge(styles.content, styles.subContent, cssOverride)}
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
  cssOverride?: CSSObject;
};

const DropdownMenuContent = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>((props, ref) => {
  const { cssOverride, sideOffset = 4, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal container={getPortalContainer()}>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        css={scopedMerge(styles.content, styles.contentWidth, cssOverride)}
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
  cssOverride?: CSSObject;
};

const DropdownMenuItem = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>((props, ref) => {
  const { cssOverride, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      css={scopedMerge(styles.item, inset && styles.itemInset, cssOverride)}
      {...rest}
    />
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

type DropdownMenuCheckboxItemProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DropdownMenuCheckboxItem = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>((props, ref) => {
  const { cssOverride, children, checked, ...rest } = props;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      css={scopedMerge(styles.item, styles.checkboxOrRadioItem, cssOverride)}
      checked={checked}
      {...rest}
    >
      <span css={scoped(styles.itemIndicator)}>
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
  cssOverride?: CSSObject;
};

const DropdownMenuRadioItem = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>((props, ref) => {
  const { cssOverride, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      css={scopedMerge(styles.item, styles.checkboxOrRadioItem, cssOverride)}
      {...rest}
    >
      <span css={scoped(styles.itemIndicator)}>
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
  cssOverride?: CSSObject;
};

const DropdownMenuLabel = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>((props, ref) => {
  const { cssOverride, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      css={scopedMerge(styles.label, inset && styles.itemInset, cssOverride)}
      {...rest}
    />
  );
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

type DropdownMenuSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DropdownMenuSeparator = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      css={scopedMerge(styles.separator, cssOverride)}
      {...rest}
    />
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

type DropdownMenuShortcutProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const DropdownMenuShortcut = (props: DropdownMenuShortcutProps) => {
  const { cssOverride, ...rest } = props;

  return <span css={scopedMerge(styles.shortcut, cssOverride)} {...rest} />;
};

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
};

const styles = defineStyles({
  content: {
    minWidth: '128px',
    padding: `${theme.spacing[1]} 0`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    boxShadow: theme.shadow.md,
    maxHeight: '424px',
    overflowX: 'hidden',
    overflowY: 'auto',
    color: theme.colors.text.primary,
    ...getOverlayMotionStyles(
      'var(--radix-dropdown-menu-content-transform-origin)',
    ),
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  },
  contentWidth: {
    width: '256px',
  },
  subContent: {
    width: 'max-content',
    minWidth: '160px',
    maxWidth: '256px',
  },
  item: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    margin: `0 ${theme.spacing[1]}`,
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    height: '32px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    outline: 'none',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    userSelect: 'none',
    '&:hover, &[data-highlighted]': {
      backgroundColor: theme.colors.background.optionHover,
    },
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
      color: theme.colors.text.disabled,
    },
    '&[data-state="open"]': {
      backgroundColor: theme.colors.background.optionHover,
    },
  },
  itemInset: {
    paddingLeft: theme.spacing[8],
  },
  checkboxOrRadioItem: {
    paddingLeft: `calc(${theme.spacing[2]} + ${theme.spacing[4]} + ${theme.spacing[2]})`,
  },
  itemIndicator: {
    position: 'absolute',
    left: theme.spacing[2],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    width: '16px',
    height: '16px',
    color: theme.colors.icon.primary,
  },
  chevron: {
    marginLeft: 'auto',
    flexShrink: 0,
    color: theme.colors.icon.secondary,
  },
  label: {
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    margin: `0 ${theme.spacing[1]}`,
    ...theme.typography.small('semibold'),
    color: theme.colors.text.primary,
    pointerEvents: 'none',
  },
  separator: {
    height: '1px',
    backgroundColor: theme.colors.border.default,
    margin: `${theme.spacing[1]} 0`,
    border: 'none',
  },
  shortcut: {
    marginLeft: 'auto',
    paddingLeft: theme.spacing[4],
    ...theme.typography.small(),
    color: theme.colors.text.muted,
  },
});
