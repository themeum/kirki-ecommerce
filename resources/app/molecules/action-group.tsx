import type { ReactNode, CSSProperties } from 'react';

import Flex from '@/molecules/flex';
import { CLASS_PREFIX } from '@/conf';

type ActionGroupProps = {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  gap?: number;
};

const ActionGroup = ({
  children,
  style = {},
  className = '',
  gap = 8,
}: ActionGroupProps) => {
  return (
    <Flex
      className={`${CLASS_PREFIX}-action-group ${className}`}
      gap={gap}
      style={style}
    >
      {children}
    </Flex>
  );
};

export default ActionGroup;
