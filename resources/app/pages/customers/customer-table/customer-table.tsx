import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import { useMarkList } from '@/hooks';
import Checkbox from '@/molecules/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import { deleteCustomersAPI, setKeyValue } from '@/store/customersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { TaxonomyTableHeader } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import CustomerTableAction from '@/pages/customers/customer-table/customer-table-action';
import SingleRow from '@/pages/customers/customer-table/single-row';

const CustomerTable = () => {
  const data = useAppSelector((state) => state.customers?.data);
  const dispatch = useAppDispatch();
  const { results, total, per_page } = data!;
  const tableHeaders: TaxonomyTableHeader[] = [
    {
      title: __('Customer', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'first_name',
        reducer: 'customers',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Orders', 'kirki-ecommerce'),
    },
    {
      title: __('Amount Spent', 'kirki-ecommerce'),
    },
    {
      title: __('Location', 'kirki-ecommerce'),
    },
    {
      title: __('Last Order', 'kirki-ecommerce'),
    },
    {
      title: __('Joined at', 'kirki-ecommerce'),
    },
    {
      title: __('', 'kirki-ecommerce'),
    },
  ];
  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data: data! });

  const handleApplyAction = async (action: string) => {
    if (action === 'delete') {
      let result = {} as Awaited<ReturnType<typeof deleteCustomersAPI>>;
      if (selectedItems.includes('*')) {
        result = await deleteCustomersAPI({
          action: 'delete-all',
          ids: null,
        });
      } else {
        result = await deleteCustomersAPI({
          action: 'delete',
          ids: selectedItems as number[],
        });
      }

      if (isApiSuccess(result)) {
        dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
        handleClearSelection();
      } else {
        console.log(result);
      }
    }
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

export default CustomerTable;
