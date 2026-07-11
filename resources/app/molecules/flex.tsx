import type { ReactNode, CSSProperties } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { FlexDirection } from '@/types';

type FlexProps = {
  children?: ReactNode;
  direction?: FlexDirection;
  gap?: number;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
};

const Flex = ({
  children,
  direction,
  gap,
  style = {},
  className = '',
  onClick = () => {},
}: FlexProps) => {
  return (
    <div
      className={`${CLASS_PREFIX}-flex${
        direction ? '-' + direction : ''
      } ${className}`}
      style={{ gap: gap || 0, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Flex;
