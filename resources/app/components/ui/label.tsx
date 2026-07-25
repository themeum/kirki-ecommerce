import { type SerializedStyles } from '@emotion/react';
import * as LabelPrimitive from '@radix-ui/react-label';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type LabelProps = Omit<
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  'className' | 'css'
> & {
  css?: SerializedStyles | SerializedStyles[];
};

const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        css={[styles.root, cssProp]}
        {...rest}
      />
    );
  },
);

Label.displayName = 'Label';

export default Label;

const styles = {
  root: scoped({
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
  }),
};
