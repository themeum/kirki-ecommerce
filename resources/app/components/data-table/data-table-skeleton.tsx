import type { Table as TableInstance } from '@tanstack/react-table';

import { getPinnedCss, getPinningStyle } from '@/components/data-table/column-styles';
import type { DataTableItem } from '@/components/data-table/types';
import Skeleton from '@/components/ui/skeleton';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mergeCss } from '@/theme/mixins';

type DataTableSkeletonProps<T extends DataTableItem> = {
  table: TableInstance<T>;
  rowCount: number;
  headerHeight?: number;
  rowHeight?: number;
};

const SELECTION_SKELETON_SIZE = 16;
const CELL_SKELETON_HEIGHT = 12;
const FALLBACK_HEADER_HEIGHT = 42;
const FALLBACK_ROW_HEIGHT = 58;

const DataTableSkeleton = <T extends DataTableItem>(props: DataTableSkeletonProps<T>) => {
  const {
    table,
    rowCount,
    headerHeight = FALLBACK_HEADER_HEIGHT,
    rowHeight = FALLBACK_ROW_HEIGHT,
  } = props;

  const columns = table.getVisibleLeafColumns();

  return (
    <>
      <TableHeader>
        <TableRow style={{ height: `${headerHeight}px` }}>
          {columns.map((column) => {
            const meta = column.columnDef.meta;
            const isSelectColumn = column.id === 'select';

            return (
              <TableHead
                key={column.id}
                onlyCheckbox={isSelectColumn}
                alignment={meta?.alignment}
                cssOverride={mergeCss(meta?.cssOverride, getPinnedCss(column, true))}
                style={getPinningStyle(column)}
              >
                {isSelectColumn ? (
                  <Skeleton
                    width={SELECTION_SKELETON_SIZE}
                    height={SELECTION_SKELETON_SIZE}
                    radius="sm"
                  />
                ) : (
                  <Skeleton width="60%" height={CELL_SKELETON_HEIGHT} />
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <TableRow key={rowIndex} style={{ height: `${rowHeight}px` }}>
            {columns.map((column) => {
              const meta = column.columnDef.meta;
              const isSelectColumn = column.id === 'select';

              return (
                <TableCell
                  key={column.id}
                  onlyCheckbox={isSelectColumn}
                  alignment={meta?.alignment}
                  cssOverride={mergeCss(meta?.cssOverride, getPinnedCss(column, false))}
                  style={getPinningStyle(column)}
                >
                  {isSelectColumn ? (
                    <Skeleton
                      width={SELECTION_SKELETON_SIZE}
                      height={SELECTION_SKELETON_SIZE}
                      radius="sm"
                    />
                  ) : (
                    <Skeleton height={CELL_SKELETON_HEIGHT} />
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

DataTableSkeleton.displayName = 'DataTableSkeleton';

export default DataTableSkeleton;
export type { DataTableSkeletonProps };
