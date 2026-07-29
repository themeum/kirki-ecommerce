import DataTable from '@/components/data-table/data-table';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import {
  DataTableFilter,
  DataTableSelectionFilter,
  DataTableFilterBar,
} from '@/components/data-table/data-table-slots';

const DataTableNamespace = Object.assign(DataTable, {
  Filter: DataTableFilter,
  SelectionFilter: DataTableSelectionFilter,
  FilterBar: DataTableFilterBar,
  Pagination: DataTablePagination,
});

export default DataTableNamespace;
export { useDataTableSelection } from '@/components/data-table/data-table-selection-context';
export type {
  DataTableBulkApplyPayload,
  DataTableColumn,
  DataTableItem
} from '@/components/data-table/types';
export {
  DataTableFilter,
  DataTableSelectionFilter,
  DataTableFilterBar,
  DataTablePagination
};

