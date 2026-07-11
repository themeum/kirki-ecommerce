import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type PopoverDescriptionProps = StyleProps & {
  children?: ReactNode;
};

const PopoverDescription = (props: PopoverDescriptionProps) => {
  const { children, style = {}, className = '' } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-popover-description ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default PopoverDescription;
