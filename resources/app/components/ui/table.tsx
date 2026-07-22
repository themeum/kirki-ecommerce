import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import type { TableAlignment, TableType } from '@/types';

type TableEditMode = 'multiCell' | 'singleCell';

type TableProps = HTMLAttributes<HTMLTableElement> & {
  type?: TableType;
  scrollable?: boolean;
  editMode?: TableEditMode;
  fixed?: boolean;
};

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  const {
    children,
    type = 'default',
    className,
    scrollable,
    editMode,
    fixed,
    ...rest
  } = props;

  return (
    <table
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-table`,
        `${CLASS_PREFIX}-ui-table--${type}`,
        fixed && `${CLASS_PREFIX}-ui-table--fixed`,
        scrollable && `${CLASS_PREFIX}-ui-table--scrollable`,
        editMode === 'multiCell' && `${CLASS_PREFIX}-ui-table--multi-cell-edit`,
        editMode === 'singleCell' &&
          `${CLASS_PREFIX}-ui-table--single-cell-edit`,
        className,
      )}
      {...rest}
    >
      {children}
    </table>
  );
});

Table.displayName = 'Table';

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <thead
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-table-header`, className)}
      {...rest}
    />
  );
});

TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <tbody
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-table-body`, className)}
      {...rest}
    />
  );
});

TableBody.displayName = 'TableBody';

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  active?: boolean;
};

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  (props, ref) => {
    const { className, active = false, ...rest } = props;

    return (
      <tr
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-table-row`,
          active && `${CLASS_PREFIX}-ui-table-row--active`,
          className,
        )}
        {...rest}
      />
    );
  },
);

TableRow.displayName = 'TableRow';

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
};

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (props, ref) => {
    const { className, onlyCheckbox, alignment, ...rest } = props;

    return (
      <th
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-table-head`,
          onlyCheckbox && `${CLASS_PREFIX}-ui-table-cell--only-checkbox`,
          alignment === 'right' && `${CLASS_PREFIX}-ui-table-cell--align-right`,
          alignment === 'center' &&
            `${CLASS_PREFIX}-ui-table-cell--align-center`,
          className,
        )}
        {...rest}
      />
    );
  },
);

TableHead.displayName = 'TableHead';

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
  disabled?: boolean;
};

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, ref) => {
    const { className, onlyCheckbox, alignment, disabled, ...rest } = props;

    return (
      <td
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-table-cell`,
          onlyCheckbox && `${CLASS_PREFIX}-ui-table-cell--only-checkbox`,
          alignment === 'right' && `${CLASS_PREFIX}-ui-table-cell--align-right`,
          alignment === 'center' &&
            `${CLASS_PREFIX}-ui-table-cell--align-center`,
          disabled && `${CLASS_PREFIX}-ui-table-cell--disabled`,
          className,
        )}
        {...rest}
      />
    );
  },
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
