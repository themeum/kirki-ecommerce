import type { MouseEventHandler, ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type TableRowProps = StyleProps & {
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
  active?: boolean;
};

const TableRow = (props: TableRowProps) => {
  const {
    children,
    className = '',
    style = {},
    onClick = () => {},
    active = false,
  } = props;
  return (
    <tr
      className={className + (active ? ` ${CLASS_PREFIX}-active` : '')}
      style={style}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export default TableRow;
