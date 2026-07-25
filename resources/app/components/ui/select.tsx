import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { type SerializedStyles, type Theme } from '@emotion/react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';

import { theme } from '@/theme';
import { flexCenter, itemCenter, scoped, uiFocusRing } from '@/theme/mixins';
import { getPortalContainer } from '@/libs/portal-container';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

type SelectTriggerVariant = 'default' | 'secondary' | 'invisible';

type SelectTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  'className' | 'css'
> & {
  variant?: SelectTriggerVariant;
  error?: boolean;
  css?: SerializedStyles;
};

const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>((props, ref) => {
  const {
    css: cssProp,
    variant = 'default',
    error,
    children,
    ...rest
  } = props;

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-error={error ? 'true' : undefined}
      css={[
        styles.trigger,
        styles.variants[variant],
        error && styles.error,
        cssProp,
      ]}
      {...rest}
    >
      <span css={styles.value}>{children}</span>
      <SelectPrimitive.Icon asChild>
        <span css={styles.chevron}>
          <ChevronDownIcon width={16} height={16} />
        </span>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

type SelectContentProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>((props, ref) => {
  const {
    css: cssProp,
    children,
    position = 'item-aligned',
    ...rest
  } = props;
  const isPopper = position === 'popper';

  return (
    <SelectPrimitive.Portal container={getPortalContainer()}>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        css={[styles.content, isPopper && styles.contentPopper, cssProp]}
        {...rest}
      >
        <SelectPrimitive.Viewport
          css={[styles.viewport, isPopper && styles.viewportPopper]}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

SelectContent.displayName = 'SelectContent';

type SelectLabelProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <SelectPrimitive.Label ref={ref} css={[styles.label, cssProp]} {...rest} />;
});

SelectLabel.displayName = 'SelectLabel';

type SelectItemProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>((props, ref) => {
  const { css: cssProp, children, ...rest } = props;

  return (
    <SelectPrimitive.Item ref={ref} css={[styles.item, cssProp]} {...rest}>
      <span css={styles.itemIndicator}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon width={16} height={16} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

SelectItem.displayName = 'SelectItem';

type SelectSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <SelectPrimitive.Separator
      ref={ref}
      css={[styles.separator, cssProp]}
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

const styles = {
  trigger: scoped({
    width: '100%',
    minWidth: '90px',
    height: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing[2],
    ...theme.typography.small(),
    cursor: 'pointer',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-disabled]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  }),
  variants: {
    default: scoped({}),
    secondary: scoped({
      backgroundColor: theme.colors.background.fillSecondary,
      border: 'none',
      ...theme.typography.small(),
      borderRadius: theme.radius.md,
    }),
    invisible: scoped({
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      height: '100%',
      '&:focus-visible, &[data-state="open"]': {
        borderColor: 'transparent',
        boxShadow: 'none',
      },
    }),
  },
  error: scoped({
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme as Theme, theme.colors.border.critical),
    },
  }),
  value: scoped({
    ...itemCenter(),
    columnGap: theme.spacing[2],
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  chevron: scoped({
    ...flexCenter(),
    flexShrink: 0,
  }),
  content: scoped({
    padding: theme.spacing[1],
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.md,
    backgroundColor: theme.colors.background.fill,
    minHeight: '33px',
    zIndex: 100000,
    overflowX: 'hidden',
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  }),
  contentPopper: scoped({
    maxHeight: 'var(--radix-select-content-available-height)',
  }),
  viewport: scoped({
    width: '100%',
  }),
  viewportPopper: scoped({
    width: '100%',
    minWidth: 'var(--radix-select-trigger-width)',
    height: 'var(--radix-select-trigger-height)',
  }),
  label: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    ...theme.typography.small('medium'),
    color: theme.colors.text.secondary,
  }),
  item: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    paddingLeft: `calc(${theme.spacing[2]} + ${theme.spacing[4]} + ${theme.spacing[2]})`,
    ...itemCenter(),
    justifyContent: 'flex-start',
    columnGap: theme.spacing[2],
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    position: 'relative',
    outline: 'none',
    ...theme.typography.small(),
    '&:hover, &[data-highlighted]': {
      backgroundColor: theme.colors.background.optionHover,
    },
    '&[data-disabled]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  itemIndicator: scoped({
    position: 'absolute',
    left: theme.spacing[2],
    minWidth: '16px',
    ...itemCenter(),
  }),
  separator: scoped({
    height: '1px',
    backgroundColor: theme.colors.border.default,
    margin: `${theme.spacing[1]} 0`,
  }),
};
