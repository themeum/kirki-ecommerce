import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import { useListParams, useMarkList } from '@/hooks';
import Checkbox from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBulkDeleteCustomersMutation } from '@/services/customer';
import type {
  CustomerListItem,
  PaginatedData,
  TaxonomyTableHeader,
} from '@/types';
import { __ } from '@/wpi18n';

import CustomerTableAction from '@/pages/customers/customer-table/customer-table-action';
import SingleRow from '@/pages/customers/customer-table/single-row';

type CustomerTableProps = {
  data: PaginatedData<CustomerListItem>;
  isFetching?: boolean;
};

const CustomerTable = ({ data }: CustomerTableProps) => {
  const { params, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'first_name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const bulkDeleteMutation = useBulkDeleteCustomersMutation();

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams({ sort_by: sortBy, sort_order: sortOrder });
  };

  const { results, total, per_page } = data;

  const tableHeaders: TaxonomyTableHeader[] = [
    {
      title: __('Customer', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'first_name',
        activeSortBy: params.sort_by,
        sortOrder: params.sort_order,
        onSort: handleSort,
      },
    },
    { title: __('Orders', 'kirki-ecommerce') },
    { title: __('Amount Spent', 'kirki-ecommerce') },
    { title: __('Location', 'kirki-ecommerce') },
    { title: __('Last Order', 'kirki-ecommerce') },
    { title: __('Joined at', 'kirki-ecommerce') },
    { title: __('', 'kirki-ecommerce') },
  ];

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data });

  const handleApplyAction = async (action: string) => {
    if (action !== 'delete') {
      return;
    }

    if (selectedItems.includes('*')) {
      await bulkDeleteMutation.mutateAsync({
        action: 'delete-all',
        ids: null,
      });
    } else {
      await bulkDeleteMutation.mutateAsync({
        action: 'delete',
        ids: selectedItems as number[],
      });
    }
    handleClearSelection();
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[
            { value: 'delete', title: __('Delete', 'kirki-ecommerce') },
          ]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action as string)}
          total={total}
          per_page={per_page}
        />
      ) : (
        <CustomerTableAction />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox>
              <Checkbox
                value={isSelected('*')}
                onChange={handleAllCheckboxClick}
                isPartialChecked={itemCount > 0 && itemCount < total}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index}>
                <Sorting data={header} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((item, index) => (
            <SingleRow
              key={index}
              item={item}
              isSelected={isSelected}
              handleSingleCheckboxClick={handleSingleCheckboxClick}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
};

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
