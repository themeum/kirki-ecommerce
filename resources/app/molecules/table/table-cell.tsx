import type { MouseEventHandler, ReactNode } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps, TableAlignment } from '@/types';

type TableCellProps = StyleProps & {
  children?: ReactNode;
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
  onMouseDown?: MouseEventHandler<HTMLTableCellElement>;
  onMouseEnter?: MouseEventHandler<HTMLTableCellElement>;
  disabled?: boolean;
};

const TableCell = (props: TableCellProps) => {
  const {
    children,
    className = '',
    style = {},
    onlyCheckbox,
    alignment,
    onMouseDown = () => {},
    onMouseEnter = () => {},
    disabled,
  } = props;

  const tableCellStyles: Record<string, string> = {
    onlyCheckbox: `${CLASS_PREFIX}-only-checkbox`,
    right: `${CLASS_PREFIX}-align-right`,
    center: `${CLASS_PREFIX}-align-center`,
  };

  const allClassNames = classNames(
    alignment ? tableCellStyles[alignment] : undefined,
    onlyCheckbox && `${CLASS_PREFIX}-only-checkbox`,
    disabled && `${CLASS_PREFIX}-disabled`,
    className,
  );

  return (
    <td
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={allClassNames}
      style={style}
    >
      {children}
    </td>
  );
};

export default TableCell;
