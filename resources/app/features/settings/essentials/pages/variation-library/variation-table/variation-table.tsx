import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { type Dispatch, type MouseEvent, type SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import type { DataTableBulkAction } from '@/components/data-table';
import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import type { Attribute, AttributeValue } from '@/features/products';
import { useBulkDeleteAttributeValuesMutation, useDeleteAttributeValueMutation } from '@/features/products';
import { getVariationColumns } from '@/features/settings/essentials/pages/variation-library/variation-table/columns';
import VariantTableFilters from '@/features/settings/essentials/pages/variation-library/variation-table/variant-table-filters';
import VariationValuePopover from '@/features/settings/essentials/pages/variation-library/variation-value-popover';
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

const variationBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Delete', 'kirki-ecommerce'), destructive: true },
];

const VariationTable = ({
  results = [],
  selectedItem,
  updateDataList,
}: VariationTableProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  // `useMutation` hands back a fresh object every render, so depending on it
  // rebuilds `columns`, and a new cell renderer remounts every cell — taking
  // the edit button the popover is anchored to with it. `mutate` is stable.
  const { mutate: deleteValue } = useDeleteAttributeValueMutation();
  const { mutate: bulkDeleteValues } = useBulkDeleteAttributeValuesMutation();
  const [searchValue, setSearchValue] = useState('');
  const [editingItem, setEditingItem] = useState<AttributeValue | null>(null);
  const editAnchorRef = useRef<HTMLElement | null>(null);

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
          deleteValue({ attribute_id: selectedItem.id, value_id: item.id });
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
    [confirmAction, deleteValue, selectedItem],
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
            bulkDeleteValues({
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
    [bulkDeleteValues, confirmAction, selectedItem],
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
        meta: { alignment: 'right' },
        cell: ({ row }) => (
          <DataTableRowActions
            edit={{
              onClick: (event: MouseEvent<HTMLButtonElement>) => {
                editAnchorRef.current = event.currentTarget;
                setEditingItem(row.original);
              },
            }}
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
        tableId="variation-library"
        enableColumnVisibility={false}
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
        bulkActions={variationBulkActions}
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
      <VariationValuePopover
        isOpen={Boolean(editingItem)}
        onOpenChange={(next) => {
          if (!next) {
            setEditingItem(null);
          }
        }}
        anchorRef={editAnchorRef}
        editedItem={editingItem}
        type={selectedItem?.type}
        selectedItem={selectedItem}
      />
    </>
  );
};

VariationTable.displayName = 'VariationTable';

export default VariationTable;
