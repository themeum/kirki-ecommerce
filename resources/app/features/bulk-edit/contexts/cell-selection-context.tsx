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
} from 'react';

import {
  clearSelection,
  commitFill,
  extendSelection,
  fillRange,
  isCellFilled,
  isCellSelected,
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

type CellSelectionContextValue = {
  isDragging: boolean;
  activeCell: ActiveCell;
  isSelected: (field: string, row: number) => boolean;
  isFilled: (field: string, row: number) => boolean;
  isHandle: (field: string, row: number) => boolean;
  isActive: (field: string, row: number) => boolean;
  /** Rows a value change at (field, row) should propagate to. */
  getPropagationTargets: (field: string, row: number) => number[];
  onCellMouseDown: (field: string, row: number, selectable: boolean, shiftKey: boolean, metaOrCtrlKey: boolean) => void;
  onCellMouseEnter: (field: string, row: number, selectable: boolean) => void;
  onGrabberMouseDown: (field: string, row: number) => void;
  activateCell: (field: string, row: number) => void;
  deactivateCell: () => void;
  clear: () => void;
};

const CellSelectionContext = createContext<CellSelectionContextValue | null>(null);

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
  const [selection, setSelection] = useState<SelectionState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);

  const selectionRef = useRef<SelectionState>(null);
  selectionRef.current = selection;

  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

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

  const activateCell = useCallback((field: string, row: number) => {
    setActiveCell({ field, row });
  }, []);

  const deactivateCell = useCallback(() => {
    setActiveCell(null);
  }, []);

  const clear = useCallback(() => {
    setSelection(clearSelection());
    setActiveCell(null);
  }, []);

  const onCellMouseDown = useCallback(
    (field: string, row: number, selectable: boolean, shiftKey: boolean, metaOrCtrlKey: boolean) => {
      if (!selectable) {
        return;
      }

      const current = selectionRef.current;

      if (activeCell?.field === field && activeCell.row === row) {
        return;
      }

      setActiveCell(null);

      if (metaOrCtrlKey) {
        setSelection(toggleSelection(current, field, row, true));
        setIsDragging(true);
        return;
      }

      if (shiftKey && current?.field === field) {
        setSelection(extendSelection(current, field, row, true));
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
        setActiveCell({ field, row });
        return;
      }

      setSelection(startSelection(current, field, row, true));
      setIsDragging(true);
    },
    [activeCell],
  );

  const onCellMouseEnter = useCallback((field: string, row: number, selectable: boolean) => {
    if (!isDraggingRef.current) {
      return;
    }
    const current = selectionRef.current;
    if (current?.mode === 'fill') {
      setSelection(updateFill(current, row));
      return;
    }
    setSelection(extendSelection(current, field, row, selectable));
  }, []);

  const onGrabberMouseDown = useCallback((field: string, _row: number) => {
    const current = selectionRef.current;
    if (current?.field !== field) {
      return;
    }
    setActiveCell(null);
    setSelection(startFill(current));
    setIsDragging(true);
  }, []);

  const getPropagationTargets = useCallback((field: string, row: number) => {
    const current = selectionRef.current;
    if (current?.mode === 'select' && current.field === field) {
      const range = selectionRange(current);
      if (range.includes(row) && range.length > 1) {
        return range;
      }
    }
    return [row];
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const current = selectionRef.current;
      if (current?.mode === 'fill') {
        const rows = fillRange(current);
        onFillCommit({ field: current.field, sourceRow: current.fillOriginRow, rows });
        setSelection(commitFill(current));
      }
      setIsDragging(false);
      edgeDirectionRef.current = null;
    };

    const handleMouseMove = (event: MouseEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };

      if (!isDraggingRef.current) {
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
  }, [containerRef, onFillCommit]);

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
          const current = selectionRef.current;
          if (current?.mode === 'fill') {
            setSelection(updateFill(current, resolved.row));
          } else {
            setSelection(extendSelection(current, resolved.field, resolved.row, true));
          }
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, containerRef, resolveCellAtPoint]);

  useEffect(() => {
    const handleOutsideMouseDown = (event: globalThis.MouseEvent) => {
      const container = containerRef.current;
      if ((!activeCell && !selectionRef.current) || !container) {
        return;
      }
      if (!(event.target instanceof Node) || !container.contains(event.target)) {
        clear();
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [activeCell, clear, containerRef]);

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
      const current = selectionRef.current;
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
        setActiveCell({ field: current.field, row: current.focusRow });
        onTypeToEdit(current.field, getPropagationTargets(current.field, current.focusRow), event.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTypeToEdit, onSpaceToggle, getPropagationTargets]);

  const value = useMemo<CellSelectionContextValue>(
    () => ({
      isDragging,
      activeCell,
      isSelected: (field, row) => isCellSelected(selection, field, row),
      isFilled: (field, row) => isCellFilled(selection, field, row),
      isHandle: (field, row) => isHandleRow(selection, field, row),
      isActive: (field, row) => activeCell?.field === field && activeCell.row === row,
      getPropagationTargets,
      onCellMouseDown,
      onCellMouseEnter,
      onGrabberMouseDown,
      activateCell,
      deactivateCell,
      clear,
    }),
    [
      isDragging,
      activeCell,
      selection,
      getPropagationTargets,
      onCellMouseDown,
      onCellMouseEnter,
      onGrabberMouseDown,
      activateCell,
      deactivateCell,
      clear,
    ],
  );

  return <CellSelectionContext.Provider value={value}>{children}</CellSelectionContext.Provider>;
};

CellSelectionProvider.displayName = 'CellSelectionProvider';

const useCellSelection = (): CellSelectionContextValue => {
  const context = useContext(CellSelectionContext);
  if (!context) {
    throw new Error('useCellSelection must be used within CellSelectionProvider');
  }
  return context;
};

export { CellSelectionProvider, useCellSelection };
export type { ActiveCell, FillCommitPayload };
