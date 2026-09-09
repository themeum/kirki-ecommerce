import { type CSSObject } from '@emotion/react';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import type { ComponentRef } from 'react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import {
  defineStyles,
  flexCenter,
  itemCenter,
  scoped,
  scopedMerge,
  uiFocusRing,
} from '@/theme/mixins';

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
  cssOverride?: CSSObject;
};

const SelectTrigger = forwardRef<ComponentRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  (props, ref) => {
    const { cssOverride, variant = 'default', error, children, ...rest } = props;

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        data-slot="select-trigger"
        data-error={error ? 'true' : undefined}
        css={scopedMerge(
          styles.trigger,
          styles.variants[variant],
          error && styles.error,
          cssOverride,
        )}
        {...rest}
      >
        <span css={scoped(styles.value)}>{children}</span>
        <SelectPrimitive.Icon asChild>
          <span css={scoped(styles.chevron)}>
            <ChevronDownIcon width={16} height={16} />
          </span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

type SelectContentProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const SelectContent = forwardRef<ComponentRef<typeof SelectPrimitive.Content>, SelectContentProps>(
  (props, ref) => {
    const { cssOverride, children, position = 'item-aligned', ...rest } = props;
    const isPopper = position === 'popper';

    return (
      <SelectPrimitive.Portal container={getPortalContainer()}>
        <SelectPrimitive.Content
          ref={ref}
          position={position}
          css={scopedMerge(
            styles.content,
            isPopper ? styles.contentPopper : styles.contentItemAligned,
            cssOverride,
          )}
          {...rest}
        >
          <SelectPrimitive.Viewport css={scoped(styles.viewport)}>
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);

SelectContent.displayName = 'SelectContent';

type SelectLabelProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
  'className' | 'css'
> & {
  icon?: ReactNode;
  cssOverride?: CSSObject;
};

const SelectLabel = forwardRef<ComponentRef<typeof SelectPrimitive.Label>, SelectLabelProps>(
  (props, ref) => {
    const { cssOverride, icon, children, ...rest } = props;

    return (
      <SelectPrimitive.Label ref={ref} css={scopedMerge(styles.label, cssOverride)} {...rest}>
        {icon && <span css={scoped(styles.labelIcon)}>{icon}</span>}
        {children}
      </SelectPrimitive.Label>
    );
  },
);

SelectLabel.displayName = 'SelectLabel';

type SelectItemProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
  'className' | 'css'
> & {
  endSlot?: ReactNode;
  cssOverride?: CSSObject;
};

const SelectItem = forwardRef<ComponentRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  (props, ref) => {
    const { cssOverride, endSlot, children, ...rest } = props;

    return (
      <SelectPrimitive.Item ref={ref} css={scopedMerge(styles.item, cssOverride)} {...rest}>
        <span css={scoped(styles.itemIndicator)}>
          <SelectPrimitive.ItemIndicator>
            <CheckIcon width={16} height={16} />
          </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {endSlot && <span css={scoped(styles.itemEndSlot)}>{endSlot}</span>}
      </SelectPrimitive.Item>
    );
  },
);

SelectItem.displayName = 'SelectItem';

type SelectSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const SelectSeparator = forwardRef<
  ComponentRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <SelectPrimitive.Separator
      ref={ref}
      css={scopedMerge(styles.separator, cssOverride)}
      {...rest}
    />
  );
});

SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

/**
 * Radix's `item-aligned` positioning lines the option text up with the trigger's
 * value text, not the panel's edge up with the trigger's edge. Our option rows
 * carry a check gutter the trigger does not, so the panel lands
 * `ITEM_ALIGNED_OFFSET` too far left and Radix widens its wrapper by the same
 * amount. Pushing the content back right by that offset lands both the panel's
 * left edge and its width on the trigger.
 *
 * This holds only while the trigger keeps a 1px border and `spacing[3]` side
 * padding, `<SelectValue>` stays the trigger's first child, and the content keeps
 * a 1px border with `spacing[1]` of viewport side padding.
 */
const ITEM_PADDING_LEFT = `calc(${theme.spacing[2]} + ${theme.spacing[4]} + ${theme.spacing[2]})`;
const TRIGGER_VALUE_INSET = `calc(1px + ${theme.spacing[3]})`;
const ITEM_TEXT_INSET = `calc(1px + ${theme.spacing[1]} + ${ITEM_PADDING_LEFT})`;
const ITEM_ALIGNED_OFFSET = `calc(${ITEM_TEXT_INSET} - ${TRIGGER_VALUE_INSET})`;

const styles = defineStyles({
  trigger: {
    width: '100%',
    minWidth: '90px',
    height: '32px',
    border: `1px solid ${theme.colors.border.secondary}`,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing[2],
    ...theme.typography.small(),
    cursor: 'pointer',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.background.fillBrand,
    },
    '&[data-disabled]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  },
  variants: {
    default: {},
    secondary: {
      backgroundColor: theme.colors.background.fillSecondary,
      border: '1px solid transparent',
      ...theme.typography.small(),
      borderRadius: theme.radius.md,
    },
    invisible: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      height: '100%',
      '&:focus-visible, &[data-state="open"]': {
        borderColor: 'transparent',
        boxShadow: 'none',
      },
    },
  },
  error: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme, theme.colors.border.critical),
    },
  },
  value: {
    ...itemCenter(),
    columnGap: theme.spacing[2],
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    ...flexCenter(),
    flexShrink: 0,
  },
  content: {
    padding: `${theme.spacing[1]} 0`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.popover,
    backgroundColor: theme.colors.background.fill,
    minHeight: '33px',
    zIndex: theme.zIndex.dropdown,
    overflowX: 'hidden',
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
  },
  contentItemAligned: {
    marginLeft: ITEM_ALIGNED_OFFSET,
  },
  contentPopper: {
    maxHeight: 'var(--radix-select-content-available-height)',
    minWidth: 'var(--radix-select-trigger-width)',
  },
  viewport: {
    width: '100%',
    padding: `0 ${theme.spacing[1]}`,
  },
  label: {
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    ...itemCenter(),
    columnGap: theme.spacing[2],
    ...theme.typography.tiny(),
    color: theme.colors.text.secondary,
  },
  labelIcon: {
    ...flexCenter(),
    minWidth: '16px',
    flexShrink: 0,
    '& svg': {
      display: 'block',
    },
  },
  item: {
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
    paddingLeft: ITEM_PADDING_LEFT,
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
  },
  itemIndicator: {
    position: 'absolute',
    left: theme.spacing[2],
    minWidth: '16px',
    ...itemCenter(),
  },
  itemEndSlot: {
    marginLeft: 'auto',
    paddingLeft: theme.spacing[4],
    ...theme.typography.small('semibold'),
    color: theme.colors.text.primary,
  },
  separator: {
    height: '1px',
    backgroundColor: theme.colors.border.default,
    margin: `${theme.spacing[1]} calc(-1 * ${theme.spacing[1]})`,
    pointerEvents: 'none',
  },
});
