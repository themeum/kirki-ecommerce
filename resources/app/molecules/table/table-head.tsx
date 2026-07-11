import type { ReactNode } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { StyleProps, TableAlignment } from '@/types';

type TableHeadProps = StyleProps & {
  children?: ReactNode;
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
};

const TableHead = (props: TableHeadProps) => {
  const {
    children,
    className = '',
    style = {},
    onlyCheckbox,
    alignment,
  } = props;

  const tableHeadeStyles: Record<string, string> = {
    onlyCheckbox: `${CLASS_PREFIX}-only-checkbox`,
    right: `${CLASS_PREFIX}-align-right`,
    center: `${CLASS_PREFIX}-align-center`,
  };

  const allClassNames = classNames(
    alignment ? tableHeadeStyles[alignment] : undefined,
    onlyCheckbox && `${CLASS_PREFIX}-only-checkbox`,
    className,
  );
  return (
    <th className={allClassNames} style={style}>
      {children}
    </th>
  );
};

export default TableHead;
