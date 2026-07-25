import { keyframes, type SerializedStyles } from '@emotion/react';
import { Loader2 } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';

import { scoped } from '@/theme/mixins';

type SpinnerProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <span
      ref={ref}
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      css={[styles.root, cssProp]}
      {...rest}
    >
      <Loader2 aria-hidden="true" />
    </span>
  );
});

Spinner.displayName = 'Spinner';

export default Spinner;
export type { SpinnerProps };

const spinnerSpin = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

const styles = {
  root: scoped({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '12px',
    height: '12px',
    color: 'currentColor',
    '& svg': {
      width: '12px',
      height: '12px',
      animation: `${spinnerSpin} 0.8s linear infinite`,
    },
  }),
};
