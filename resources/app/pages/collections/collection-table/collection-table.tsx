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
import { useBulkDeleteCollectionsMutation } from '@/services/collection';
import type { Collection, PaginatedData, TaxonomyTableHeader } from '@/types';
import { __ } from '@/wpi18n';

import CollectionTableAction from '@/pages/collections/collection-table/collection-table-action';
import SingleRow from '@/pages/collections/collection-table/single-row';

type CollectionTableProps = {
  data: PaginatedData<Collection>;
  isFetching?: boolean;
};

const CollectionTable = ({ data }: CollectionTableProps) => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const bulkDeleteMutation = useBulkDeleteCollectionsMutation();

  const { results, total, per_page } = data;

  const tableHeaders: TaxonomyTableHeader[] = [
    { title: __('Collection', 'kirki-ecommerce') },
    { title: __('Products', 'kirki-ecommerce') },
    { title: __('Created at', 'kirki-ecommerce') },
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

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[{ value: 'delete', title: __('Delete', 'kirki-ecommerce') }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action as string)}
          total={total}
          per_page={per_page}
        />
      ) : (
        <CollectionTableAction onSortChange={handleSortChange} />
      )}

      <Table fixed>
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
              <TableHead key={index}>{header.title}</TableHead>
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

CollectionTable.displayName = 'CollectionTable';

export default CollectionTable;
