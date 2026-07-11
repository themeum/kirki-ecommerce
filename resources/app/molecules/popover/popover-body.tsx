import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type PopoverBodyProps = StyleProps & {
  children?: ReactNode;
};

const PopoverBody = (props: PopoverBodyProps) => {
  const { children, style = {}, className = '' } = props;
  return (
    <div className={`${CLASS_PREFIX}-popover-body ${className}`} style={style}>
      {children}
    </div>
  );
};

export default PopoverBody;
