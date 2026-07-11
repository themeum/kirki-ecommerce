import type { ReactNode } from 'react';

import type { StyleProps } from '@/types';

type TableBodyProps = StyleProps & {
  children?: ReactNode;
};

const TableBody = (props: TableBodyProps) => {
  const { children, className = '', style = {} } = props;

  return (
    <tbody className={className} style={style}>
      {children}
    </tbody>
  );
};

export default TableBody;
