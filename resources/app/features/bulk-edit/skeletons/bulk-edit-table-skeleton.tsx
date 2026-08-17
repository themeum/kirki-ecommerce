import Skeleton from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { allTableHeaders } from '@/features/bulk-edit/lib/utils';
import { bulkEditTableStyles } from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table-styles';

type BulkEditTableSkeletonProps = {
  selectedFields: string[];
  rowCount?: number;
};

const CELL_SKELETON_HEIGHT = 12;
const DEFAULT_ROW_COUNT = 10;

const BulkEditTableSkeleton = (props: BulkEditTableSkeletonProps) => {
  const { selectedFields, rowCount = DEFAULT_ROW_COUNT } = props;

  const headers = allTableHeaders.filter((item) => selectedFields.includes(item?.value));

  return (
    <Table cssOverride={bulkEditTableStyles} style={{ minWidth: '100vw' }} aria-busy>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead
              alignment={header?.alignment}
              key={index}
              data-sticky-cell={index === 0 ? 'true' : undefined}
            >
              <Skeleton width="60%" height={CELL_SKELETON_HEIGHT} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <TableRow key={rowIndex}>
            {headers.map((header, index) => (
              <TableCell
                alignment={header?.alignment}
                key={index}
                data-sticky-cell={index === 0 ? 'true' : undefined}
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
