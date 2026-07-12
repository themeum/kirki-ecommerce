import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import { useListParams, useMarkList } from '@/hooks';
import Checkbox from '@/molecules/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import { useBulkDeleteBrandsMutation } from '@/services/brand';
import type { Brand, PaginatedData, TaxonomyTableHeader } from '@/types';
import { __ } from '@/wpi18n';

import BrandTableAction from '@/pages/brands/brand-table/brand-table-action';
import SingleRow from '@/pages/brands/brand-table/single-row';

type BrandTableProps = {
  data: PaginatedData<Brand>;
  isFetching?: boolean;
};

const BrandTable = ({ data }: BrandTableProps) => {
  const { params, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const bulkDeleteMutation = useBulkDeleteBrandsMutation();

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams({ sort_by: sortBy, sort_order: sortOrder });
  };

  const tableHeaders: TaxonomyTableHeader[] = [
    {
      title: __('Name', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'name',
        activeSortBy: params.sort_by,
        sortOrder: params.sort_order,
        onSort: handleSort,
      },
    },
    { title: __('Image', 'kirki-ecommerce') },
    {
      title: __('Description', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'description',
        activeSortBy: params.sort_by,
        sortOrder: params.sort_order,
        onSort: handleSort,
      },
    },
    {
      title: __('Slug', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'slug',
        activeSortBy: params.sort_by,
        sortOrder: params.sort_order,
        onSort: handleSort,
      },
    },
    {
      title: __('Count', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'count',
        activeSortBy: params.sort_by,
        sortOrder: params.sort_order,
        onSort: handleSort,
      },
    },
  ];

  const { results, total, per_page } = data;

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
        <BrandTableAction />
      )}
      <Table type="variation">
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox style={{ padding: '20px 12px' }}>
              <Checkbox
                value={isSelected('*')}
                onChange={handleAllCheckboxClick}
                isPartialChecked={itemCount > 0 && itemCount < total}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index} style={{ padding: '20px 12px' }}>
                <Sorting data={header} />
              </TableHead>
            ))}
            <TableHead></TableHead>
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

BrandTable.displayName = 'BrandTable';

export default BrandTable;
