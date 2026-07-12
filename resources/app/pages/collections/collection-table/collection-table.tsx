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
import { useAppSelector } from '@/store/hooks';
import type { TaxonomyTableHeader } from '@/types';
import { __ } from '@/wpi18n';

import CollectionTableAction from '@/pages/collections/collection-table/collection-table-action';
import SingleRow from '@/pages/collections/collection-table/single-row';

const CollectionTable = () => {
  const data = useAppSelector((state) => state.collections?.data);
  const { results, total, per_page } = data!;

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data: data! });

  const tableHeaders: TaxonomyTableHeader[] = [
    { title: __('Collection', 'kirki-ecommerce') },
    { title: __('Products', 'kirki-ecommerce') },
    { title: __('Created at', 'kirki-ecommerce') },
    { title: __('', 'kirki-ecommerce') },
  ];

  const handleApplyAction = async (_action: string | number | null) => {};

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[{ value: 'delete', title: __('Delete', 'kirki-ecommerce') }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action)}
          total={total}
          per_page={per_page}
        />
      ) : (
        <CollectionTableAction />
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

export default CollectionTable;
