import { type CSSObject } from '@emotion/react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type LabelProps = Omit<
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        css={scopedMerge(styles.root, cssOverride)}
        {...rest}
      />
    );
  },
);

Label.displayName = 'Label';

export default Label;

const styles = defineStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    ...theme.typography.small('medium'),
    color: theme.colors.text.primary,
    userSelect: 'none',
    cursor: 'default',
    '&[data-disabled="true"]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    '.group[data-disabled="true"] &': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    '.peer:disabled ~ &': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});
