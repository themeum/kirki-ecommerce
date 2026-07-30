import { type SerializedStyles, type Theme } from '@emotion/react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import {
  ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';

import { theme } from '@/theme';
import { flexCenter, scoped, uiFocusRing } from '@/theme/mixins';

type RadioGroupProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const RadioGroup = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      css={[styles.root, cssProp]}
      {...rest}
    />
  );
});

RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const RadioGroupItem = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <RadioGroupPrimitive.Item ref={ref} css={[styles.item, cssProp]} {...rest}>
      <RadioGroupPrimitive.Indicator css={styles.indicator}>
        <Circle size={10} fill="currentColor" strokeWidth={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };

const styles = {
  root: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  }),
  item: scoped({
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
  }),
  indicator: scoped({
    ...flexCenter(),
    display: 'flex',
    color: theme.colors.background.fillBrand,
    padding: 0,
    margin: 0,
  }),
};
