import type { VisibilityState } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'kirki-ecommerce:bulk-edit:column-visibility';

const readStoredVisibility = (): VisibilityState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  } catch {
    return {};
  }
};

/**
 * All columns are visible by default; the merchant's choice persists across
 * visits. The Variants column is pinned and never offered as hideable, so it
 * never appears in this state.
 */
const useColumnVisibility = (): [VisibilityState, (next: VisibilityState) => void] => {
  const [columnVisibility, setColumnVisibilityState] = useState<VisibilityState>(readStoredVisibility);

  const setColumnVisibility = (next: VisibilityState) => {
    setColumnVisibilityState(next);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {
      // Best-effort persistence; a full or blocked store just falls back to session-only state.
    }
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility];
};

export { useColumnVisibility };
