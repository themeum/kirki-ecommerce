import type { ReactNode } from 'react';

import type { StyleProps } from '@/types';

type TableHeaderProps = StyleProps & {
  children?: ReactNode;
};

const TableHeader = (props: TableHeaderProps) => {
  const { children, className = '', style = {} } = props;
  return (
    <thead className={className} style={style}>
      {children}
    </thead>
  );
};

export default TableHeader;
