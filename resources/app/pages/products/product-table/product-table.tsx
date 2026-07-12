import { useEffect } from 'react';

import BulkActionHandler from '@/components/bulk-action-handler';
import { useMarkList } from '@/hooks';
import Checkbox from '@/molecules/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProductsAPI, setKeyValue } from '@/store/productsSlice';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import FilterPopup from '@/pages/products/product-table/filter-popup/filter-popup';
import ProductTableAction from '@/pages/products/product-table/product-table-action';
import ProductTableFilterAction from '@/pages/products/product-table/product-table-filter-action';
import SingleRow from '@/pages/products/product-table/single-row';

type TableHeader = {
  title: string;
};

const ProductTable = () => {
  const tableHeaders: TableHeader[] = [
    { title: __('Product', 'kirki-ecommerce') },
    { title: __('SKU', 'kirki-ecommerce') },
    { title: __('Inventory', 'kirki-ecommerce') },
    { title: __('Price', 'kirki-ecommerce') },
    { title: __('Status', 'kirki-ecommerce') },
    { title: __('Date', 'kirki-ecommerce') },
  ];

  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.products?.data);
  const filterData = useAppSelector((state) => state.products?.filter);
  const { results, total, per_page } = data!;

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    isPartiallySelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data: data! });

  useEffect(() => {
    handleClearSelection();
  }, [filterData]);

  const handleApplyAction = async (action: string) => {
    if (action === 'delete') {
      let result = {} as Awaited<ReturnType<typeof deleteProductsAPI>>;
      if (selectedItems.includes('*')) {
        result = await deleteProductsAPI({
          action: 'delete-all',
          ids: null,
        });
      } else {
        result = await deleteProductsAPI({
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
          optionsArray={[{ value: 'trash', title: __('Trash', 'kirki-ecommerce') }]}
          itemCount={itemCount}
          onSelectAll={
            itemCount === total ? handleClearSelection : handleSelectAll
          }
          onApply={(action) => handleApplyAction(action as string)}
          filterAction={<FilterPopup />}
          total={total}
          per_page={per_page}
        />
      ) : (
        <ProductTableAction />
      )}
      {filterData && Object.keys(filterData).length > 0 ? (
        <ProductTableFilterAction />
      ) : null}

      <Table fixed>
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox>
              <Checkbox
                value={isSelected('*')}
                onChange={handleAllCheckboxClick}
                isPartialChecked={isPartiallySelected('*')}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index}>{header.title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((item) => (
            <SingleRow
              key={item?.id}
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

export default ProductTable;
