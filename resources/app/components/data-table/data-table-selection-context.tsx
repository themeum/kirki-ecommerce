import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

import type { DataTableItem } from '@/components/data-table/types';
import { useListParams, useMarkList } from '@/hooks';
import type { PaginatedData } from '@/types';

type SelectedItem = string | number;

type DataTableSelectionContextValue = {
  selectedItems: SelectedItem[];
  itemCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  isRowSelected: (id: SelectedItem) => boolean;
  onToggleRow: (value: boolean | string | number, id: SelectedItem) => void;
  onToggleAll: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

const DataTableSelectionContext =
  createContext<DataTableSelectionContextValue | null>(null);

type DataTableSelectionProviderProps = {
  data: PaginatedData<DataTableItem>;
  children: ReactNode;
};

const DataTableSelectionProvider = ({
  data,
  children,
}: DataTableSelectionProviderProps) => {
  const markList = useMarkList({ data });
  const { params } = useListParams();

  /*
   * `useMarkList` rebuilds its handlers on every render because they close over
   * the current page's rows. Reading them through a ref keeps the exposed
   * callbacks stable, so a data change alone never invalidates this context —
   * that is what lets the header and toolbar sit still during a search.
   */
  const markListRef = useRef(markList);
  markListRef.current = markList;

  const isRowSelected = useCallback(
    (id: SelectedItem) => markListRef.current.isSelected(id),
    [],
  );

  const onToggleRow = useCallback(
    (value: boolean | string | number, id: SelectedItem) => {
      markListRef.current.handleSingleCheckboxClick(value, id);
    },
    [],
  );

  const onToggleAll = useCallback(() => {
    markListRef.current.handleAllCheckboxClick();
  }, []);

  const onSelectAll = useCallback(() => {
    markListRef.current.handleSelectAll();
  }, []);

  const onClearSelection = useCallback(() => {
    markListRef.current.handleClearSelection();
  }, []);

  const filterSignature = useMemo(() => {
    const { page, limit, sort_by, sort_order, ...rest } = params;
    return JSON.stringify(rest);
  }, [params]);

  useEffect(() => {
    if (!markListRef.current.selectedItems.length) {
      return;
    }
    markListRef.current.handleClearSelection();
  }, [filterSignature]);

  const { selectedItems, itemCount } = markList;
  const isAllSelected = markList.isSelected('*');
  const isPartiallySelected = markList.isPartiallySelected('*');

  const value = useMemo<DataTableSelectionContextValue>(
    () => ({
      selectedItems,
      itemCount,
      isAllSelected,
      isPartiallySelected,
      isRowSelected,
      onToggleRow,
      onToggleAll,
      onSelectAll,
      onClearSelection,
    }),
    [
      selectedItems,
      itemCount,
      isAllSelected,
      isPartiallySelected,
      isRowSelected,
      onToggleRow,
      onToggleAll,
      onSelectAll,
      onClearSelection,
    ],
  );

  return (
    <DataTableSelectionContext.Provider value={value}>
      {children}
    </DataTableSelectionContext.Provider>
  );
};

DataTableSelectionProvider.displayName = 'DataTableSelectionProvider';

const useDataTableSelection = () => {
  const context = useContext(DataTableSelectionContext);

  if (!context) {
    throw new Error(
      'useDataTableSelection must be used within a <DataTable>.',
    );
  }

  return context;
};

export { DataTableSelectionProvider, useDataTableSelection };
export type { DataTableSelectionContextValue };

