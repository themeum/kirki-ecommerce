import Skeleton from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bulkEditColumns, ROW_HEIGHT } from '@/features/bulk-edit/lib/columns';
import { defineStyles } from '@/theme/mixins';

type BulkEditTableSkeletonProps = {
  rowCount?: number;
};

const CELL_SKELETON_HEIGHT = 12;
const DEFAULT_ROW_COUNT = 12;

const BulkEditTableSkeleton = (props: BulkEditTableSkeletonProps) => {
  const { rowCount = DEFAULT_ROW_COUNT } = props;

  return (
    <Table cssOverride={styles.table} fixed aria-busy>
      <TableHeader>
        <TableRow>
          {bulkEditColumns.map((column) => (
            <TableHead
              key={column.id}
              alignment={column.meta?.alignment}
              style={{ width: column.size }}
              data-sticky-cell={column.id === 'variant' ? 'true' : undefined}
            >
              <Skeleton width="60%" height={CELL_SKELETON_HEIGHT} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <TableRow key={rowIndex} style={{ height: ROW_HEIGHT }}>
            {bulkEditColumns.map((column) => (
              <TableCell
                key={column.id}
                alignment={column.meta?.alignment}
                style={{ width: column.size, height: ROW_HEIGHT }}
                data-sticky-cell={column.id === 'variant' ? 'true' : undefined}
              >
                <Skeleton height={CELL_SKELETON_HEIGHT} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

BulkEditTableSkeleton.displayName = 'BulkEditTableSkeleton';

export default BulkEditTableSkeleton;

const styles = defineStyles({
  table: {
    minWidth: '100%',
  },
});
