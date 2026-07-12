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
import {
  deleteCategoriesAPI,
  setKeyValue,
} from '@/store/categoriesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { TaxonomyTableHeader } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import CategoryTableAction from '@/pages/categories/category-table/category-table-action';
import SingleRow from '@/pages/categories/category-table/single-row';

const CategoryTable = () => {
  const tableHeaders: TaxonomyTableHeader[] = [
    {
      title: __('Name', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'name',
        reducer: 'categories',
        setKeyValue: setKeyValue,
      },
    },
    { title: __('Image', 'kirki-ecommerce') },
    {
      title: __('Description', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'description',
        reducer: 'categories',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Slug', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'slug',
        reducer: 'categories',
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __('Count', 'kirki-ecommerce'),
      sortable: {
        sort_by: 'count',
        reducer: 'categories',
        setKeyValue: setKeyValue,
      },
    },
  ];
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.categories?.data);
  const { results, total, per_page } = data!;

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
      let result = {} as Awaited<ReturnType<typeof deleteCategoriesAPI>>;
      if (selectedItems.includes('*')) {
        result = await deleteCategoriesAPI({
          action: 'delete-all',
          ids: null,
        });
      } else {
        result = await deleteCategoriesAPI({
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
          total={total}
          per_page={per_page}
        />
      ) : (
        <CategoryTableAction />
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

export default CategoryTable;
