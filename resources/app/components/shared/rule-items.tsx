import type { CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import Chip from '@/components/ui/chip';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItems,
} from '@/components/ui/stacked-items';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type RuleItemsElementProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
};

const RuleItems = forwardRef<HTMLDivElement, RuleItemsElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return <StackedItems ref={ref} data-slot="rule-items" cssOverride={cssOverride} {...rest} />;
});

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

const RuleItemConditions = forwardRef<HTMLDivElement, RuleItemsElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="rule-item-conditions"
      css={mergeCss(styles.conditions, cssOverride)}
      {...rest}
    />
  );
});

RuleItemConditions.displayName = 'RuleItemConditions';

const RuleItemCondition = forwardRef<HTMLDivElement, RuleItemsElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="rule-item-condition"
      css={mergeCss(styles.line, cssOverride)}
      {...rest}
    />
  );
});

RuleItemCondition.displayName = 'RuleItemCondition';

const RuleItemAction = forwardRef<HTMLDivElement, RuleItemsElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="rule-item-action"
      css={mergeCss(styles.line, cssOverride)}
      {...rest}
    />
  );
});

RuleItemAction.displayName = 'RuleItemAction';

type RuleItemValuesProps = {
  values: string[];
  maxVisible?: number;
};

const RuleItemValues = (props: RuleItemValuesProps) => {
  const { values, maxVisible = 2 } = props;
  const visibleValues = values.slice(0, maxVisible);
  const hiddenCount = values.length - visibleValues.length;

  return (
    <>
      {visibleValues.map((value, index) => (
        <Chip key={index} text={value} cssOverride={{ borderRadius: theme.radius.md }} />
      ))}
      {hiddenCount > 0 && (
        <Chip text={`${hiddenCount}+`} cssOverride={{ borderRadius: theme.radius.md }} />
      )}
    </>
  );
};

RuleItemValues.displayName = 'RuleItemValues';

const RuleItemActions = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof StackedItemActions>
>((props, ref) => <StackedItemActions ref={ref} {...props} />);

RuleItemActions.displayName = 'RuleItemActions';

export {
  RuleItem,
  RuleItemAction,
  RuleItemActions,
  RuleItemCondition,
  RuleItemConditions,
  RuleItemContent,
  RuleItems,
  RuleItemValues,
};

export type { RuleItemProps, RuleItemsElementProps, RuleItemValuesProps };

const styles = defineStyles({
  item: {
    paddingBlock: theme.spacing[2],
    height: 'auto',
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  conditions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  line: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
});
