import type { VisibilityState } from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';

const storageKey = (tableId: string) => `kirki-ecommerce:table-columns:${tableId}`;

const readStoredVisibility = (tableId: string): VisibilityState => {
  try {
    const raw = window.localStorage.getItem(storageKey(tableId));

    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  } catch {
    return {};
  }
};

const useTableColumnVisibility = (
  tableId: string,
): [VisibilityState, (columnId: string, isVisible: boolean) => void] => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    readStoredVisibility(tableId),
  );

  useEffect(() => {
    setColumnVisibility(readStoredVisibility(tableId));
  }, [tableId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(columnVisibility));
    } catch {
      /* Best-effort persistence; a table that cannot store its columns still renders. */
    }
  }, [tableId, columnVisibility]);

  const toggleColumn = useCallback((columnId: string, isVisible: boolean) => {
    setColumnVisibility((previous) => ({ ...previous, [columnId]: isVisible }));
  }, []);

  return [columnVisibility, toggleColumn];
};

export default useTableColumnVisibility;
