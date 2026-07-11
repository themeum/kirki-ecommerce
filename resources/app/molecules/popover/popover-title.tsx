import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type PopoverTitleProps = StyleProps & {
  children?: ReactNode;
};

const PopoverTitle = (props: PopoverTitleProps) => {
  const { children, style = {}, className = '' } = props;
  return (
    <div className={`${CLASS_PREFIX}-popover-title ${className}`} style={style}>
      {children}
    </div>
  );
};

export default PopoverTitle;
