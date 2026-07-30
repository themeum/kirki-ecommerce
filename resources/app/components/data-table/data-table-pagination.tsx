import { useDataTableContext } from '@/components/data-table/data-table-context';
import Pagination from '@/components/pagination';
import type { PaginationData } from '@/types';

const DataTablePagination = () => {
  const { data, onPageChange, isLoading } = useDataTableContext();

  if (isLoading) {
    return null;
  }

  return (
    <Pagination
      data={data as unknown as PaginationData}
      onChange={onPageChange}
    />
  );
};

DataTablePagination.displayName = 'DataTablePagination';

export default DataTablePagination;
