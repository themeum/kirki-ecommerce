import { forwardRef, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type DropdownTriggerProps = StyleProps & {
  children?: ReactNode;
};

const DropdownTrigger = forwardRef<HTMLDivElement, DropdownTriggerProps>(
  (props, ref) => {
    const { children, style = {}, className = '' } = props;

    return (
      <div
        ref={ref}
        className={`${CLASS_PREFIX}-dropdown-trigger ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  },
);

export default DropdownTrigger;
