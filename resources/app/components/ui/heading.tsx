import { type CSSObject } from '@emotion/react';
import { forwardRef, type CSSProperties } from 'react';

import { theme } from '@/theme';
import { scopedMerge } from '@/theme/mixins';
import type { HeadingType } from '@/types';
import { __ } from '@/wpi18n';

type HeadingProps = {
  type?: HeadingType;
  text?: string;
  style?: CSSProperties;
  cssOverride?: CSSObject;
};

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>((props, ref) => {
  const {
    cssOverride,
    type = '',
    text = __('Heading', 'kirki-ecommerce'),
    style = {},
  } = props;

  return (
    <h2
      ref={ref}
      css={scopedMerge(
        styles.base,
        type ? styles.types[type] : undefined,
        cssOverride,
      )}
      style={style}
    >
      {text}
    </h2>
  );
});

Heading.displayName = 'Heading';

export default Heading;

const styles = {
  base: ({
    margin: 0,
    ...theme.typography.large('semibold'),
  } satisfies CSSObject),
  types: {
    primary: ({
      ...theme.typography.heading4(),
    } satisfies CSSObject),
    secondary: ({
      ...theme.typography.large('semibold'),
    } satisfies CSSObject),
    tertiary: ({
      ...theme.typography.paragraph('semibold'),
    } satisfies CSSObject),
    '': ({} satisfies CSSObject),
  },
};
