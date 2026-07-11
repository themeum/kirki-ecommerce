import type { ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type DropdownMenuShortcutProps = StyleProps & {
  children?: ReactNode;
};

const DropdownMenuShortcut = (props: DropdownMenuShortcutProps) => {
  const { children, className = '', style = {} } = props;
  return (
    <div
      className={`${CLASS_PREFIX}-dropdown-shortcut-text ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default DropdownMenuShortcut;
