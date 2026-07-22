import { useEffect } from 'react';

import BulkActionHandler from '@/components/bulk-action-handler';
import { useListParams, useMarkList } from '@/hooks';
import Checkbox from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBulkDeleteProductsMutation } from '@/services/product';
import type { PaginatedData, ProductListItem } from '@/types';
import { __ } from '@/wpi18n';

import FilterPopup from '@/pages/products/product-table/filter-popup/filter-popup';
import ProductTableAction from '@/pages/products/product-table/product-table-action';
import ProductTableFilterAction from '@/pages/products/product-table/product-table-filter-action';
import SingleRow from '@/pages/products/product-table/single-row';

type TableHeader = {
  title: string;
};

type ProductTableProps = {
  data: PaginatedData<ProductListItem>;
  isFetching?: boolean;
};

const ProductTable = ({ data }: ProductTableProps) => {
  const tableHeaders: TableHeader[] = [
    { title: __('Product', 'kirki-ecommerce') },
    { title: __('SKU', 'kirki-ecommerce') },
    { title: __('Inventory', 'kirki-ecommerce') },
    { title: __('Price', 'kirki-ecommerce') },
    { title: __('Status', 'kirki-ecommerce') },
    { title: __('Date', 'kirki-ecommerce') },
  ];

  const { params } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

  const { results, total, per_page } = data;

  const bulkDeleteMutation = useBulkDeleteProductsMutation();

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    isPartiallySelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data });

  const hasActiveFilters = Boolean(
    params.category_ids?.length ||
      params.brand_ids?.length ||
      params.collection_ids?.length ||
      params.status ||
      params.stock_status,
  );

  useEffect(() => {
    handleClearSelection();
  }, [
    params.category_ids,
    params.brand_ids,
    params.collection_ids,
    params.status,
    params.stock_status,
  ]);

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
      {hasActiveFilters ? <ProductTableFilterAction /> : null}

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

ProductTable.displayName = 'ProductTable';

export default ProductTable;
