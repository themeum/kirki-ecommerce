import { type SerializedStyles, type Theme } from '@emotion/react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { theme } from '@/theme';
import { scoped, uiFocusRing } from '@/theme/mixins';

type SwitchProps = Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <SwitchPrimitive.Root ref={ref} css={[styles.root, cssProp]} {...rest}>
        <SwitchPrimitive.Thumb css={styles.thumb} />
      </SwitchPrimitive.Root>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;

const styles = {
  root: scoped({
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
      ...uiFocusRing(theme as Theme),
    },
    '&[data-state="checked"]': {
      backgroundColor: '#5641f3',
    },
    '&[data-state="checked"] > span': {
      transform: 'translateX(18px)',
    },
    '&:disabled, &[data-disabled]': {
      cursor: 'not-allowed !important',
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  thumb: scoped({
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fill,
    transform: 'translateX(2px)',
    transition: 'transform 0.15s ease',
    willChange: 'transform',
  }),
};
