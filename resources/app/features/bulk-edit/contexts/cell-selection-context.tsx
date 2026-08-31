import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  clearSelection,
  commitFill,
  extendSelection,
  fillRange,
  isCellFilled,
  isCellSelected,
  isFocusCell,
  isHandleRow,
  selectionRange,
  type SelectionState,
  startFill,
  startSelection,
  toggleSelection,
  updateFill,
} from '@/features/bulk-edit/lib/selection';

type ActiveCell = { field: string; row: number } | null;

type FillCommitPayload = {
  field: string;
  sourceRow: number;
  rows: number[];
};

type SelectionStoreState = {
  selection: SelectionState;
  activeCell: ActiveCell;
  isDragging: boolean;
};

type SelectionStore = {
  getState: () => SelectionStoreState;
  setState: (updater: (previous: SelectionStoreState) => SelectionStoreState) => void;
  subscribe: (listener: () => void) => () => void;
};

/**
 * A hand-rolled pub-sub store, read via `useSyncExternalStore`, instead of
 * plain `useState`. React context has no per-key selector: if selection/
 * activeCell/isDragging lived in state and were exposed through one context
 * value, every mounted cell (hundreds, even virtualized) would re-render on
 * every mousedown/mouseenter, which is what made clicking feel laggy. Here,
 * each cell subscribes only to the specific boolean it needs (see
 * `useIsCellSelected` etc. below), so a state change only re-renders the
 * handful of cells whose own flag actually flipped.
 */
const createSelectionStore = (): SelectionStore => {
  let state: SelectionStoreState = { selection: null, activeCell: null, isDragging: false };
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (updater) => {
      state = updater(state);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

type CellSelectionActions = {
  /** Rows a value change at (field, row) should propagate to. */
  getPropagationTargets: (field: string, row: number) => number[];
  onCellMouseDown: (field: string, row: number, selectable: boolean, shiftKey: boolean, metaOrCtrlKey: boolean) => void;
  onCellMouseEnter: (field: string, row: number, selectable: boolean) => void;
  onGrabberMouseDown: (field: string, row: number) => void;
  activateCell: (field: string, row: number) => void;
  deactivateCell: () => void;
  clear: () => void;
};

const CellSelectionStoreContext = createContext<SelectionStore | null>(null);
const CellSelectionActionsContext = createContext<CellSelectionActions | null>(null);

const EDGE_THRESHOLD_PX = 48;
const EDGE_SCROLL_SPEED_PX = 14;

type CellSelectionProviderProps = {
  children: ReactNode;
  containerRef: RefObject<HTMLElement | null>;
  onFillCommit: (payload: FillCommitPayload) => void;
  /** First printable keystroke on a selected (not yet active) text/number/money cell; `rows` is the fan-out target set. */
  onTypeToEdit: (field: string, rows: number[], char: string) => void;
  /** Space pressed on a selected checkbox cell; `rows` is the fan-out target set. */
  onSpaceToggle: (field: string, rows: number[]) => void;
};

const isEditableElement = (element: Element | null): boolean => {
  if (!element) {
    return false;
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLButtonElement) {
    return true;
  }
  return element.getAttribute('contenteditable') === 'true';
};

const CellSelectionProvider = ({ children, containerRef, onFillCommit, onTypeToEdit, onSpaceToggle }: CellSelectionProviderProps) => {
  const [store] = useState(createSelectionStore);
  const isDragging = useSyncExternalStore(store.subscribe, () => store.getState().isDragging);

  const lastPointerRef = useRef({ x: 0, y: 0 });
  const edgeDirectionRef = useRef<'up' | 'down' | null>(null);

  const resolveCellAtPoint = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    const cell = el?.closest<HTMLElement>('[data-bulk-row]');
    if (!cell) {
      return null;
    }
    const row = Number(cell.dataset.bulkRow);
    const field = cell.dataset.bulkField;
    if (Number.isNaN(row) || !field) {
      return null;
    }
    return { field, row };
  }, []);

  const activateCell = useCallback(
    (field: string, row: number) => {
      store.setState((previous) => ({ ...previous, activeCell: { field, row } }));
    },
    [store],
  );

  const deactivateCell = useCallback(() => {
    store.setState((previous) => ({ ...previous, activeCell: null }));
  }, [store]);

  const clear = useCallback(() => {
    store.setState((previous) => ({ ...previous, selection: clearSelection(), activeCell: null }));
  }, [store]);

  /**
   * Every branch below reads a single `store.getState()` snapshot and issues
   * at most one `setState` call, so a click notifies subscribers once (not
   * twice, as a separate activeCell-then-selection update would).
   */
  const onCellMouseDown = useCallback(
    (field: string, row: number, selectable: boolean, shiftKey: boolean, metaOrCtrlKey: boolean) => {
      if (!selectable) {
        return;
      }

      const { selection: current, activeCell } = store.getState();

      if (activeCell?.field === field && activeCell.row === row) {
        return;
      }

      if (metaOrCtrlKey) {
        store.setState((previous) => ({
          ...previous,
          activeCell: null,
          selection: toggleSelection(current, field, row, true),
          isDragging: true,
        }));
        return;
      }

      if (shiftKey && current?.field === field) {
        store.setState((previous) => ({ ...previous, activeCell: null, selection: extendSelection(current, field, row, true) }));
        return;
      }

      /**
       * A second, separate click on an already-sole-selected cell activates
       * it — the two-stage model select-like cells (and Enter/double-click
       * activation generally) depend on. This is distinct from the reverted
       * "click anywhere in a multi-cell selection preserves it" behavior:
       * `selectionRange(current).length === 1` scopes this to exactly the
       * single-cell case, so clicking a cell inside a larger selection still
       * collapses to it instead of activating.
       */
      if (current?.field === field && isCellSelected(current, field, row) && selectionRange(current).length === 1) {
        store.setState((previous) => ({ ...previous, activeCell: { field, row } }));
        return;
      }

      store.setState((previous) => ({
        ...previous,
        activeCell: null,
        selection: startSelection(current, field, row, true),
        isDragging: true,
      }));
    },
    [store],
  );

  /**
   * Only ever mutates state while `isDragging` is true (a plain hover never
   * reaches the `setState` calls below), so it's a no-op for ordinary mouse
   * movement — it exists purely to extend a range/fill drag as the pointer
   * crosses into a new cell, matching the click-drag-to-select-a-range and
   * drag-the-fill-handle gestures a spreadsheet grid needs. The store/
   * selector split above is what keeps its updates cheap: each mouseenter
   * during a drag only re-renders the cells whose own selected/filled flag
   * actually changed, not the whole visible grid.
   */
  const onCellMouseEnter = useCallback(
    (field: string, row: number, selectable: boolean) => {
      const { isDragging: dragging, selection: current } = store.getState();
      if (!dragging) {
        return;
      }
      if (current?.mode === 'fill') {
        store.setState((previous) => ({ ...previous, selection: updateFill(current, row) }));
        return;
      }
      store.setState((previous) => ({ ...previous, selection: extendSelection(current, field, row, selectable) }));
    },
    [store],
  );

  const onGrabberMouseDown = useCallback(
    (field: string, _row: number) => {
      const { selection: current } = store.getState();
      if (current?.field !== field) {
        return;
      }
      store.setState((previous) => ({ ...previous, activeCell: null, selection: startFill(current), isDragging: true }));
    },
    [store],
  );

  const getPropagationTargets = useCallback(
    (field: string, row: number) => {
      const { selection: current } = store.getState();
      if (current?.mode === 'select' && current.field === field) {
        const range = selectionRange(current);
        if (range.includes(row) && range.length > 1) {
          return range;
        }
      }
      return [row];
    },
    [store],
  );

  useEffect(() => {
    const handleMouseUp = () => {
      const { selection: current } = store.getState();
      if (current?.mode === 'fill') {
        const rows = fillRange(current);
        onFillCommit({ field: current.field, sourceRow: current.fillOriginRow, rows });
        store.setState((previous) => ({ ...previous, selection: commitFill(current), isDragging: false }));
      } else {
        store.setState((previous) => ({ ...previous, isDragging: false }));
      }
      edgeDirectionRef.current = null;
    };

    const handleMouseMove = (event: MouseEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };

      if (!store.getState().isDragging) {
        edgeDirectionRef.current = null;
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();

      if (event.clientY < rect.top + EDGE_THRESHOLD_PX && event.clientY >= rect.top) {
        edgeDirectionRef.current = 'up';
      } else if (event.clientY > rect.bottom - EDGE_THRESHOLD_PX && event.clientY <= rect.bottom) {
        edgeDirectionRef.current = 'down';
      } else {
        edgeDirectionRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef, onFillCommit, store]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    let frame: number;

    const tick = () => {
      const container = containerRef.current;
      const direction = edgeDirectionRef.current;

      if (container && direction) {
        container.scrollBy({ top: direction === 'up' ? -EDGE_SCROLL_SPEED_PX : EDGE_SCROLL_SPEED_PX });

        const resolved = resolveCellAtPoint(lastPointerRef.current.x, lastPointerRef.current.y);
        if (resolved) {
          const { selection: current } = store.getState();
          if (current?.mode === 'fill') {
            store.setState((previous) => ({ ...previous, selection: updateFill(current, resolved.row) }));
          } else {
            store.setState((previous) => ({ ...previous, selection: extendSelection(current, resolved.field, resolved.row, true) }));
          }
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, containerRef, resolveCellAtPoint, store]);

  useEffect(() => {
    const handleOutsideMouseDown = (event: globalThis.MouseEvent) => {
      const container = containerRef.current;
      const { activeCell, selection } = store.getState();
      if ((!activeCell && !selection) || !container) {
        return;
      }
      if (!(event.target instanceof Node) || !container.contains(event.target)) {
        clear();
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [clear, containerRef, store]);

  /**
   * Sheets-style "select, then just start typing": a selected (not yet
   * active) text/number/money cell has no focused input to receive
   * keystrokes, so the first printable keystroke is captured here and
   * handed to the form-owning parent via `onTypeToEdit` (the selection
   * context itself has no react-hook-form access — same reasoning as
   * `onFillCommit`). Space on a selected checkbox cell is handled the same
   * way via `onSpaceToggle`, since a checkbox has no typed value to seed.
   */
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const { selection: current } = store.getState();
      if (!current || isEditableElement(document.activeElement)) {
        return;
      }

      const target = document.querySelector<HTMLElement>(
        `[data-bulk-field="${current.field}"][data-bulk-row="${current.focusRow}"]`,
      );
      const kind = target?.dataset.bulkEditableKind;

      if (kind === 'checkbox' && event.key === ' ') {
        event.preventDefault();
        onSpaceToggle(current.field, getPropagationTargets(current.field, current.focusRow));
        return;
      }

      const isPlainPrintableKey = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ';
      if (isPlainPrintableKey && (kind === 'text' || kind === 'number' || kind === 'money')) {
        event.preventDefault();
        store.setState((previous) => ({ ...previous, activeCell: { field: current.field, row: current.focusRow } }));
        onTypeToEdit(current.field, getPropagationTargets(current.field, current.focusRow), event.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTypeToEdit, onSpaceToggle, getPropagationTargets, store]);

  /**
   * Every dependency here (`getPropagationTargets`, `onCellMouseDown`, ...)
   * only ever closes over `store`, which never changes identity — so this
   * object is built once and then never again for the life of the provider.
   * Consumers that only need to dispatch actions (not read selection state)
   * never re-render when a click/drag updates the store.
   */
  const actions = useMemo<CellSelectionActions>(
    () => ({
      getPropagationTargets,
      onCellMouseDown,
      onCellMouseEnter,
      onGrabberMouseDown,
      activateCell,
      deactivateCell,
      clear,
    }),
    [getPropagationTargets, onCellMouseDown, onCellMouseEnter, onGrabberMouseDown, activateCell, deactivateCell, clear],
  );

  return (
    <CellSelectionStoreContext.Provider value={store}>
      <CellSelectionActionsContext.Provider value={actions}>{children}</CellSelectionActionsContext.Provider>
    </CellSelectionStoreContext.Provider>
  );
};

CellSelectionProvider.displayName = 'CellSelectionProvider';

const useCellSelectionStore = (): SelectionStore => {
  const store = useContext(CellSelectionStoreContext);
  if (!store) {
    throw new Error('useCellSelectionStore must be used within CellSelectionProvider');
  }
  return store;
};

const useCellSelection = (): CellSelectionActions => {
  const actions = useContext(CellSelectionActionsContext);
  if (!actions) {
    throw new Error('useCellSelection must be used within CellSelectionProvider');
  }
  return actions;
};

const useIsCellSelected = (field: string, row: number): boolean => {
  const store = useCellSelectionStore();
  return useSyncExternalStore(store.subscribe, () => isCellSelected(store.getState().selection, field, row));
};

const useIsCellFilled = (field: string, row: number): boolean => {
  const store = useCellSelectionStore();
  return useSyncExternalStore(store.subscribe, () => isCellFilled(store.getState().selection, field, row));
};

const useIsHandleCell = (field: string, row: number): boolean => {
  const store = useCellSelectionStore();
  return useSyncExternalStore(store.subscribe, () => isHandleRow(store.getState().selection, field, row));
};

const useIsFocusCell = (field: string, row: number): boolean => {
  const store = useCellSelectionStore();
  return useSyncExternalStore(store.subscribe, () => isFocusCell(store.getState().selection, field, row));
};

const useIsActiveCell = (field: string, row: number): boolean => {
  const store = useCellSelectionStore();
  return useSyncExternalStore(store.subscribe, () => {
    const { activeCell } = store.getState();
    return activeCell?.field === field && activeCell.row === row;
  });
};

export { CellSelectionProvider, useCellSelection, useIsActiveCell, useIsCellFilled, useIsCellSelected, useIsFocusCell, useIsHandleCell };
export type { FillCommitPayload };
