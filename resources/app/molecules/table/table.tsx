import type { ReactNode } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps, TableType } from '@/types';

type TableEditMode = 'multiCell' | 'singleCell';

type TableProps = StyleProps & {
  children?: ReactNode;
  type?: TableType;
  scrollable?: boolean;
  editMode?: TableEditMode;
  fixed?: boolean;
};

const Table = (props: TableProps) => {
  const {
    children,
    type = 'default',
    className = '',
    style = {},
    scrollable,
    editMode,
    fixed,
  } = props;
  const tableVariants: {
    type: Record<TableType, string>;
    editMode: Record<TableEditMode, string>;
    fixed: string;
    scrollable: string;
  } = {
    type: {
      default: `${CLASS_PREFIX}-table-default`,
      variation: `${CLASS_PREFIX}-table-variation`,
      wide: `${CLASS_PREFIX}-table-wide`,
    },
    editMode: {
      multiCell: `${CLASS_PREFIX}-multi-cell-edit`,
      singleCell: `${CLASS_PREFIX}-single-cell-edit`,
    },
    fixed: `${CLASS_PREFIX}-table-fixed`,
    scrollable: `${CLASS_PREFIX}-table-scrollable`,
  };
  const allClassNames = classNames(
    tableVariants.type[type],
    fixed && tableVariants.fixed,
    scrollable && tableVariants.scrollable,
    editMode ? tableVariants.editMode[editMode] : undefined,
    className,
  );
  return (
    <table className={allClassNames} style={style}>
      {children}
    </table>
  );
};

export default Table;
