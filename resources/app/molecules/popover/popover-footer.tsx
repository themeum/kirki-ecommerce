import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type PopoverFooterProps = StyleProps & {
  children?: ReactNode;
};

const PopoverFooter = (props: PopoverFooterProps) => {
  const { children, style = {}, className = '' } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-popover-footer ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default PopoverFooter;
