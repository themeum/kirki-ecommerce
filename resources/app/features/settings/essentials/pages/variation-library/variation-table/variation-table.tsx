import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import type { Attribute, AttributeValue } from '@/features/products';
import { useBulkDeleteAttributeValuesMutation, useDeleteAttributeValueMutation } from '@/features/products';
import { getVariationColumns } from '@/features/settings/essentials/pages/variation-library/variation-table/columns';
import VariantTableFilters from '@/features/settings/essentials/pages/variation-library/variation-table/variant-table-filters';
import VariationValuePopup from '@/features/settings/essentials/pages/variation-library/variation-value-dialog';
import { getSearchedValue, setUnsavedDataStatus } from '@/features/settings/lib/utils';
import type { ConfirmationVariant } from '@/types/components/common';
import { __ } from '@/wpi18n';

type AttributeWithMeta = Attribute & { updated_at?: string };

type SettingsOutletContext = {
  confirmAction: (params: {
    action?: () => void;
    otherProps?: {
      variant?: ConfirmationVariant;
      force?: boolean;
      title?: string;
      subtitle?: string;
    };
  }) => void;
};

type VariationTableProps = {
  results?: AttributeValue[];
  selectedItem?: AttributeWithMeta;
  updateDataList: Dispatch<SetStateAction<AttributeValue[]>>;
};

const variationBulkActions = [{ value: 'delete', title: __('Delete', 'kirki-ecommerce') }];

const VariationTable = ({
  results = [],
  selectedItem,
  updateDataList,
}: VariationTableProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const deleteMutation = useDeleteAttributeValueMutation();
  const bulkDeleteMutation = useBulkDeleteAttributeValuesMutation();
  const [searchValue, setSearchValue] = useState('');
  const [editingItem, setEditingItem] = useState<AttributeValue | null>(null);

  const filteredList = useMemo(() => {
    const keyword = searchValue?.trim();
    if (!keyword) {
      return results;
    }
    return getSearchedValue(keyword, results);
  }, [searchValue, results]);

  const handleDeleteValue = useCallback(
    (item: AttributeValue) => {
      if (!selectedItem) {
        return;
      }

      setUnsavedDataStatus(true);
      confirmAction({
        action: () => {
          deleteMutation.mutate({ attribute_id: selectedItem.id, value_id: item.id });
        },
        otherProps: {
          variant: 'delete',
          force: true,
          title: __('Delete attribute value?', 'kirki-ecommerce'),
          subtitle: __(
            'Are you sure you want to delete this value? This action cannot be undone.',
            'kirki-ecommerce',
          ),
        },
      });
    },
    [confirmAction, deleteMutation, selectedItem],
  );

  const handleBulkApply = useCallback(
    (action: string, { selectedIds }: DataTableSelectionState) =>
      new Promise<void>((resolve) => {
        if (action !== 'delete' || !selectedItem) {
          resolve();
          return;
        }

        setUnsavedDataStatus(true);
        confirmAction({
          action: () => {
            bulkDeleteMutation.mutate({
              attribute_id: selectedItem.id,
              ids: selectedIds.map(Number),
            });
            resolve();
          },
          otherProps: {
            variant: 'delete',
            force: true,
            title: __('Delete all variation?', 'kirki-ecommerce'),
            subtitle: __(
              'Are you sure you want to delete all values? This action cannot be undone.',
              'kirki-ecommerce',
            ),
          },
        });
      }),
    [bulkDeleteMutation, confirmAction, selectedItem],
  );

  const columns = useMemo<ColumnDef<AttributeValue>[]>(() => {
    const baseColumns = getVariationColumns({
      attributeName: selectedItem?.name,
      type: selectedItem?.type,
      updatedAt: selectedItem?.updated_at,
    });

    return [
      ...baseColumns,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <DataTableRowActions
            edit={{ onClick: () => setEditingItem(row.original) }}
            actions={[
              {
                label: __('Delete', 'kirki-ecommerce'),
                icon: <Trash2 size={16} />,
                destructive: true,
                onClick: () => handleDeleteValue(row.original),
              },
            ]}
          />
        ),
      },
    ];
  }, [selectedItem, handleDeleteValue]);

  return (
    <>
      <DataTable
        data={filteredList}
        columns={columns}
        pageCount={1}
        pagination={{ pageIndex: 0, pageSize: filteredList.length || 1 }}
        onPaginationChange={() => undefined}
        sorting={[]}
        onSortingChange={() => undefined}
        hidePagination
        fixed
        enableRowSelection
        bulkActionOptions={variationBulkActions}
        onBulkApply={handleBulkApply}
        toolbar={(
          <VariantTableFilters
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            dataList={filteredList}
            updateDataList={updateDataList}
          />
        )}
      />
      <VariationValuePopup
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        editedItem={editingItem}
        type={selectedItem?.type}
        selectedItem={selectedItem}
      />
    </>
  );
};

VariationTable.displayName = 'VariationTable';

export default VariationTable;
