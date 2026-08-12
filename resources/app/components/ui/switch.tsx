import { type CSSObject } from '@emotion/react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';

type SwitchProps = Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <SwitchPrimitive.Root ref={ref} css={scopedMerge(styles.root, cssOverride)} {...rest}>
        <SwitchPrimitive.Thumb css={scoped(styles.thumb)} />
      </SwitchPrimitive.Root>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;

const styles = defineStyles({
  root: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '36px',
    height: '20px',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillTertiary,
    transition: 'background-color 0.15s ease',
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '&[data-state="checked"]': {
      backgroundColor: theme.colors.background.fillBrand,
    },
    '&[data-state="checked"] > span': {
      transform: 'translateX(18px)',
    },
    '&:disabled, &[data-disabled]': {
      cursor: 'not-allowed !important',
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
  thumb: {
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fill,
    transform: 'translateX(2px)',
    transition: 'transform 0.15s ease',
    willChange: 'transform',
  },
});
