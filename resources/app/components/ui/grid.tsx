import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type GridProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  columns?: number;
  gap?: string | number;
  css?: SerializedStyles;
};

const Grid = forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  const {
    css: cssProp,
    columns = 2,
    gap = theme.spacing[3],
    style,
    children,
    ...rest
  } = props;

  const gridStyle = {
    '--grid-columns': columns,
    '--grid-gap': typeof gap === 'number' ? `${gap}px` : gap,
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} style={gridStyle} css={[styles.root, cssProp]} {...rest}>
      {children}
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;

const styles = {
  root: scoped({
    display: 'grid',
    alignItems: 'end',
    gridTemplateColumns: 'repeat(var(--grid-columns), 1fr)',
    gap: 'var(--grid-gap)',
  }),
};
