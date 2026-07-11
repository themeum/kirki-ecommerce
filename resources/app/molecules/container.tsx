import type { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { ContainerSize } from '@/types';

type ContainerProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  size?: ContainerSize;
  scrollable?: boolean;
};

const Container = ({
  children,
  className = '',
  style = {},
  size,
  scrollable,
}: ContainerProps) => {
  const containerVariants = {
    sm: `${CLASS_PREFIX}-sm`,
    md: `${CLASS_PREFIX}-md`,
    lg: `${CLASS_PREFIX}-lg`,
    fullWidth: `${CLASS_PREFIX}-full-width`,
  };

  const allClassNames = classNames(
    `${CLASS_PREFIX}-container`,
    size && containerVariants[size],
    scrollable && `${CLASS_PREFIX}-scroll-container`,
    className,
  );

  return (
    <div className={`${allClassNames}`} style={style}>
      {children}
    </div>
  );
};

export default Container;
