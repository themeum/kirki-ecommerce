import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

type ProductPickerSkeletonProps = {
  rowCount?: number;
};

const DEFAULT_ROW_COUNT = 8;
const CELL_SKELETON_HEIGHT = 12;

const ProductPickerSkeleton = ({ rowCount = DEFAULT_ROW_COUNT }: ProductPickerSkeletonProps) => (
  <>
    {Array.from({ length: rowCount }, (_, index) => (
      <TableRow key={index}>
        <TableCell onlyCheckbox>
          <Skeleton width={16} height={16} radius="sm" />
        </TableCell>
        <TableCell>
          <Flex align="center" gap={2}>
            <Skeleton width={32} height={32} radius="sm" />
            <Skeleton width="55%" height={CELL_SKELETON_HEIGHT} />
          </Flex>
        </TableCell>
        <TableCell>
          <Skeleton width={64} height={CELL_SKELETON_HEIGHT} />
        </TableCell>
        <TableCell alignment="right">
          <Skeleton width={56} height={CELL_SKELETON_HEIGHT} />
        </TableCell>
      </TableRow>
    ))}
  </>
);

ProductPickerSkeleton.displayName = 'ProductPickerSkeleton';

export default ProductPickerSkeleton;
