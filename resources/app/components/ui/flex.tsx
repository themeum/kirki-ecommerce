import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { scoped } from '@/theme/mixins';
import type { FlexDirection } from '@/types';

type FlexProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  direction?: FlexDirection;
  gap?: number;
  css?: SerializedStyles;
};

const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const { css: cssProp, direction, gap, style, children, ...rest } = props;

  const flexStyle = {
    ...(gap !== undefined ? { '--flex-gap': `${gap}px` } : {}),
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={flexStyle}
      css={[
        styles.root,
        direction === 'column' && styles.column,
        direction === 'row' && styles.row,
        cssProp,
      ]}
      {...rest}
    >
      {children}
    </div>
  );
});

Flex.displayName = 'Flex';

export default Flex;

const styles = {
  root: scoped({
    display: 'flex',
    gap: 'var(--flex-gap)',
  }),
  column: scoped({
    flexDirection: 'column',
  }),
  row: scoped({
    flexDirection: 'row',
  }),
};
