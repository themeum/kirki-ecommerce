import { type SerializedStyles } from '@emotion/react';
import { forwardRef, type CSSProperties } from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { HeadingType } from '@/types';
import { __ } from '@/wpi18n';

type HeadingProps = {
  type?: HeadingType;
  text?: string;
  style?: CSSProperties;
  css?: SerializedStyles;
};

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>((props, ref) => {
  const {
    css: cssProp,
    type = '',
    text = __('Heading', 'kirki-ecommerce'),
    style = {},
  } = props;

  return (
    <h2
      ref={ref}
      css={[styles.base, type && styles.types[type], cssProp]}
      style={style}
    >
      {text}
    </h2>
  );
});

Heading.displayName = 'Heading';

export default Heading;

const styles = {
  base: scoped({
    margin: 0,
    ...theme.typography.large('semibold'),
  }),
  types: {
    primary: scoped({
      ...theme.typography.heading4(),
    }),
    secondary: scoped({
      ...theme.typography.large('semibold'),
    }),
    tertiary: scoped({
      ...theme.typography.paragraph('semibold'),
    }),
    '': scoped({}),
  },
};
