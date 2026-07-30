import { keyframes, type CSSObject } from '@emotion/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { scopedMerge } from '@/theme/mixins';

type SpinnerProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <span
      ref={ref}
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      css={scopedMerge(styles.root, cssOverride)}
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
  root: ({
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
  } satisfies CSSObject),
};
