import DataTable from '@/components/data-table/data-table';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import { DataTableAction, DataTableFilterAction, DataTableFilterBar } from '@/components/data-table/data-table-slots';

const DataTableNamespace = Object.assign(DataTable, {
  Action: DataTableAction,
  FilterAction: DataTableFilterAction,
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
  DataTableAction,
  DataTableFilterAction,
  DataTableFilterBar,
  DataTablePagination
};

