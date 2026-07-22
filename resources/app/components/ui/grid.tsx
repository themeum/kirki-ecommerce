import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type GridProps = HTMLAttributes<HTMLDivElement> & {
  columns?: number;
  gap?: string | number;
};

const Grid = forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  const {
    columns = 2,
    gap = '12px',
    children,
    className,
    style = {},
    ...rest
  } = props;

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
    ...style,
  };

  return (
    <div
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-grid`, className)}
      style={gridStyle}
      {...rest}
    >
      {children}
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;
