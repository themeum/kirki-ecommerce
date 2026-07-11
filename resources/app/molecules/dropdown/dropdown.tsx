import type { ReactNode } from 'react';

import type { StyleProps } from '@/types';

type DropdownProps = StyleProps & {
  children?: ReactNode;
};

const Dropdown = (props: DropdownProps) => {
  const { children, style = {}, className = '' } = props;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default Dropdown;
