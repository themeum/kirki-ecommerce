import { type CSSObject } from '@emotion/react';
import { type CSSProperties, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
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

const styles = defineStyles({
  base: {
    margin: 0,
    ...theme.typography.large('semibold'),
  },
  types: {
    primary: {
      ...theme.typography.heading4(),
    },
    secondary: {
      ...theme.typography.large('semibold'),
    },
    tertiary: {
      ...theme.typography.paragraph('semibold'),
    },
    '': {},
  },
});
