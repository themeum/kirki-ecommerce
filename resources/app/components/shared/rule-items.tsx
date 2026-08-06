import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItems,
} from '@/components/ui/stacked-items';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type RuleItemsElementProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const RuleItems = forwardRef<HTMLDivElement, RuleItemsElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <StackedItems
        ref={ref}
        data-slot="rule-items"
        cssOverride={cssOverride}
        {...rest}
      />
    );
  },
);

RuleItems.displayName = 'RuleItems';

type RuleItemProps = RuleItemsElementProps & {
  id: string;
};

const RuleItem = forwardRef<HTMLDivElement, RuleItemProps>((props, ref) => {
  const { id, cssOverride, ...rest } = props;

  return (
    <StackedItem
      ref={ref}
      id={id}
      data-slot="rule-item"
      cssOverride={mergeCss(styles.item, cssOverride)}
      {...rest}
    />
  );
});

RuleItem.displayName = 'RuleItem';

const RuleItemContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof StackedItemContent>
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <StackedItemContent
      ref={ref}
      data-slot="rule-item-content"
      cssOverride={mergeCss(styles.content, cssOverride)}
      {...rest}
    />
  );
});

RuleItemContent.displayName = 'RuleItemContent';

const RuleItemBadge = forwardRef<HTMLDivElement, RuleItemsElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="rule-item-badge"
        css={mergeCss(styles.badge, cssOverride)}
        {...rest}
      />
    );
  },
);

RuleItemBadge.displayName = 'RuleItemBadge';

const RuleItemConditions = forwardRef<HTMLDivElement, RuleItemsElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="rule-item-conditions"
        css={mergeCss(styles.conditions, cssOverride)}
        {...rest}
      />
    );
  },
);

RuleItemConditions.displayName = 'RuleItemConditions';

const RuleItemCondition = forwardRef<HTMLDivElement, RuleItemsElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="rule-item-condition"
        css={mergeCss(styles.line, cssOverride)}
        {...rest}
      />
    );
  },
);

RuleItemCondition.displayName = 'RuleItemCondition';

const RuleItemAction = forwardRef<HTMLDivElement, RuleItemsElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="rule-item-action"
        css={mergeCss(styles.line, cssOverride)}
        {...rest}
      />
    );
  },
);

RuleItemAction.displayName = 'RuleItemAction';

const RuleItemActions = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof StackedItemActions>
>((props, ref) => <StackedItemActions ref={ref} {...props} />);

RuleItemActions.displayName = 'RuleItemActions';

export {
  RuleItem,
  RuleItemAction,
  RuleItemActions,
  RuleItemBadge,
  RuleItemCondition,
  RuleItemConditions,
  RuleItemContent,
  RuleItems,
};

export type { RuleItemProps, RuleItemsElementProps };

const styles = defineStyles({
  item: {
    paddingBlock: theme.spacing[4],
  },
  content: {
    gap: theme.spacing[4],
  },
  badge: {
    display: 'flex',
    width: 'fit-content',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.surfaceSecondary,
    color: theme.colors.text.secondary,
    ...theme.typography.small(),
  },
  conditions: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  line: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
});
