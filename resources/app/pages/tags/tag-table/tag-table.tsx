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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteTagsAPI, setKeyValue } from '@/store/tagsSlice';
import type { TaxonomyTableHeader } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import TagTableAction from '@/pages/tags/tag-table/tag-table-action';
import SingleRow from '@/pages/tags/tag-table/single-row';

const TagTable = () => {
  const tableHeaders: TaxonomyTableHeader[] = [
    {
      title: __('Name', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'name',
        reducer: 'tags',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Description', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'description',
        reducer: 'tags',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Slug', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'slug',
        reducer: 'tags',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Count', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'count',
        reducer: 'tags',
        setKeyValue: setKeyValue,
      },
    },
  ];
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.tags?.data);
  const { results } = data!;

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
      let result = {} as Awaited<ReturnType<typeof deleteTagsAPI>>;
      if (selectedItems.includes('*')) {
        result = await deleteTagsAPI({
          action: 'delete-all',
          ids: null,
        });
      } else {
        result = await deleteTagsAPI({
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
          optionsArray={[{ value: 'delete', title: __('Delete', 'kirki-ecommerce') }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action as string)}
        />
      ) : (
        <TagTableAction />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox style={{ padding: '20px 12px' }}>
              <Checkbox
                value={isSelected('*')}
                onChange={handleAllCheckboxClick}
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

export default TagTable;
