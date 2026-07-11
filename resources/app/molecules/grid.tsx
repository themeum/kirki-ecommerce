import type { ReactNode, CSSProperties } from 'react';

import { CLASS_PREFIX } from '@/conf';

type GridProps = {
  columns?: number;
  gap?: string | number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const Grid = ({
  columns = 2,
  gap = '12px',
  children,
  className = '',
  style = {},
}: GridProps) => {
  return (
    <div
      className={`${CLASS_PREFIX}-grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Grid;
