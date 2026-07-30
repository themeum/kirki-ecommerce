import type { CSSObject } from '@emotion/react';
import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import { useListParams, useMarkList } from '@/hooks';
import Checkbox from '@/components/ui/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBulkDeleteCategoriesMutation } from '@/services/category';
import { theme } from '@/theme';
;
import type { Category, PaginatedData, TaxonomyTableHeader } from '@/types';
import { __ } from '@/wpi18n';

import CategoryTableAction from '@/pages/categories/category-table/category-table-action';
import SingleRow from '@/pages/categories/category-table/single-row';

type CategoryTableProps = {
  data: PaginatedData<Category>;
  isFetching?: boolean;
};

const CategoryTable = ({ data }: CategoryTableProps) => {
  const { params, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const bulkDeleteMutation = useBulkDeleteCategoriesMutation();

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
        <CategoryTableAction />
      )}
      <Table type="variation">
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox cssOverride={styles.headCell}>
              <Checkbox
                value={isSelected('*')}
                onChange={handleAllCheckboxClick}
                isPartialChecked={itemCount > 0 && itemCount < total}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index} cssOverride={styles.headCell}>
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

CategoryTable.displayName = 'CategoryTable';

export default CategoryTable;

const styles = {
  headCell: ({
    padding: `${theme.spacing[5]} ${theme.spacing[3]}`,
  } satisfies CSSObject),
};
