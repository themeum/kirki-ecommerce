import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import Checkbox from '@/components/ui/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SingleRow from '@/features/tags/components/tag-table/single-row';
import TagTableAction from '@/features/tags/components/tag-table/tag-table-action';
import type { Tag } from '@/features/tags/schemas/catalog/tag';
import { useBulkDeleteTagsMutation } from '@/features/tags/services/tag';
import { useListParams, useMarkList } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { PaginatedData } from '@/types/api/response';
import type { TaxonomyTableHeader } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type TagTableProps = {
  data: PaginatedData<Tag>;
  isFetching?: boolean;
};

const TagTable = ({ data }: TagTableProps) => {
  const { params, setParams } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const bulkDeleteMutation = useBulkDeleteTagsMutation();

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
        <TagTableAction />
      )}
      <Table>
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
            <TableHead />
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

TagTable.displayName = 'TagTable';

export default TagTable;

const styles = defineStyles({
  headCell: {
    padding: `${theme.spacing[5]} ${theme.spacing[3]}`,
  },
});
