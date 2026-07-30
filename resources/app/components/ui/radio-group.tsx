import { type CSSObject, type Theme } from '@emotion/react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { theme } from '@/theme';
import { flexCenter, uiFocusRing, scopedMerge, scoped, defineStyles } from '@/theme/mixins';

type RadioGroupProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      css={scopedMerge(styles.root, cssOverride)}
      {...rest}
    />
  );
});

RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <RadioGroupPrimitive.Item ref={ref} css={scopedMerge(styles.item, cssOverride)} {...rest}>
      <RadioGroupPrimitive.Indicator css={scoped(styles.indicator)}>
        <Circle size={8} fill="currentColor" strokeWidth={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };

const styles = defineStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  item: {
    ...flexCenter(),
    width: '16px',
    height: '16px',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: `1px solid ${theme.colors.icon.primary}`,
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent',
    color: theme.colors.background.fillBrand,
    boxSizing: 'border-box',
    '&:focus-visible': {
      ...uiFocusRing(theme as Theme),
    },
    '&[data-state="checked"]': {
      borderColor: theme.colors.background.fillBrand,
    },
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
  indicator: {
    ...flexCenter(),
    display: 'flex',
    color: theme.colors.background.fillBrand,
  },
});
