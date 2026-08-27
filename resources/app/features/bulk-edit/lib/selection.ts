type SelectionMode = 'select' | 'fill';

/**
 * `fillOriginRow` is the row edge the fill handle drag started from — its
 * value is what gets copied across the dragged range. `fillFocusRow` tracks
 * the row currently under the pointer while dragging. Outside fill mode both
 * mirror the current selection so `isHandleRow` has a single source of truth
 * for where the handle renders.
 *
 * `anchorRow`/`focusRow` model the "live" gesture — the range currently
 * being dragged or shift-extended. `committedRows` holds individual row
 * indices frozen by earlier Cmd/Ctrl-clicks in the same column, so a
 * selection can be non-contiguous. `selectionRange` is the union of both.
 */
type Selection = {
  field: string;
  anchorRow: number;
  focusRow: number;
  mode: SelectionMode;
  fillOriginRow: number;
  fillFocusRow: number;
  committedRows: number[];
};

type SelectionState = Selection | null;

const normalizeRange = (a: number, b: number): number[] => {
  const from = Math.min(a, b);
  const to = Math.max(a, b);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
};

const selectCell = (field: string, row: number): Selection => ({
  field,
  anchorRow: row,
  focusRow: row,
  mode: 'select',
  fillOriginRow: row,
  fillFocusRow: row,
  committedRows: [],
});

/**
 * Entry point for a fresh mousedown or shift-click. Read-only/non-selectable
 * columns never start a selection — the prior state is left untouched rather
 * than cleared, since pressing there isn't a "deselect everywhere" gesture.
 */
const startSelection = (
  state: SelectionState,
  field: string,
  row: number,
  selectable: boolean,
): SelectionState => {
  if (!selectable) {
    return state;
  }
  return selectCell(field, row);
};

/**
 * Extends the current selection's focus row — used for both a shift-click
 * and a continuing body-drag. Selecting in a different column starts over,
 * since a selection never spans more than one column.
 */
const extendSelection = (
  state: SelectionState,
  field: string,
  row: number,
  selectable: boolean,
): SelectionState => {
  if (!selectable) {
    return state;
  }
  if (state?.field !== field || state.mode !== 'select') {
    return selectCell(field, row);
  }
  return { ...state, focusRow: row, fillFocusRow: row };
};

/**
 * Cmd/Ctrl-click: toggles a single row's membership in the selection.
 * Toggling off a row inside the live anchor/focus range flattens the rest
 * of that range into `committedRows` first, so removing a row from the
 * middle of a dragged range splits it correctly. Toggling on a row commits
 * the current live range and starts a fresh single-row live range at the
 * clicked row, which also lets a following drag extend that new chunk.
 */
const toggleSelection = (
  state: SelectionState,
  field: string,
  row: number,
  selectable: boolean,
): SelectionState => {
  if (!selectable) {
    return state;
  }
  if (state?.field !== field) {
    return selectCell(field, row);
  }

  const liveRange = normalizeRange(state.anchorRow, state.focusRow);

  if (liveRange.includes(row)) {
    const remainingLive = liveRange.filter((liveRow) => liveRow !== row);
    const nextCommitted = [...state.committedRows, ...remainingLive];
    if (nextCommitted.length === 0) {
      return null;
    }
    const fallbackRow = nextCommitted[nextCommitted.length - 1];
    return {
      field,
      anchorRow: fallbackRow,
      focusRow: fallbackRow,
      mode: 'select',
      fillOriginRow: fallbackRow,
      fillFocusRow: fallbackRow,
      committedRows: nextCommitted.slice(0, -1),
    };
  }

  if (state.committedRows.includes(row)) {
    return { ...state, committedRows: state.committedRows.filter((committedRow) => committedRow !== row) };
  }

  return {
    field,
    anchorRow: row,
    focusRow: row,
    mode: 'select',
    fillOriginRow: row,
    fillFocusRow: row,
    committedRows: [...state.committedRows, ...liveRange],
  };
};

const startFill = (state: SelectionState): SelectionState => {
  if (!state) {
    return state;
  }
  const originRow = Math.max(...selectionRange(state));
  return { ...state, mode: 'fill', fillOriginRow: originRow, fillFocusRow: originRow };
};

const updateFill = (state: SelectionState, row: number): SelectionState => {
  if (state?.mode !== 'fill') {
    return state;
  }
  return { ...state, fillFocusRow: row };
};

/**
 * Collapses a completed fill back into a plain selection spanning the
 * original range (including any non-contiguous committed rows) plus
 * whatever was dragged over, so the merchant can keep editing the combined
 * range immediately after filling. A non-contiguous selection is
 * deliberately flattened into one contiguous range here.
 */
const commitFill = (state: SelectionState): SelectionState => {
  if (state?.mode !== 'fill') {
    return state;
  }
  const rows = [...state.committedRows, state.anchorRow, state.focusRow, state.fillOriginRow, state.fillFocusRow];
  const from = Math.min(...rows);
  const to = Math.max(...rows);
  return {
    field: state.field,
    anchorRow: from,
    focusRow: to,
    mode: 'select',
    fillOriginRow: from,
    fillFocusRow: to,
    committedRows: [],
  };
};

const clearSelection = (): SelectionState => null;

const selectionRange = (state: SelectionState): number[] => {
  if (!state) {
    return [];
  }
  const live = normalizeRange(state.anchorRow, state.focusRow);
  return Array.from(new Set([...state.committedRows, ...live])).sort((a, b) => a - b);
};

const fillRange = (state: SelectionState): number[] => {
  if (state?.mode !== 'fill') {
    return [];
  }
  return normalizeRange(state.fillOriginRow, state.fillFocusRow);
};

const isCellSelected = (state: SelectionState, field: string, row: number): boolean => {
  if (state?.field !== field) {
    return false;
  }
  return selectionRange(state).includes(row);
};

const isCellFilled = (state: SelectionState, field: string, row: number): boolean => {
  if (state?.field !== field || state.mode !== 'fill') {
    return false;
  }
  return fillRange(state).includes(row);
};

const isHandleRow = (state: SelectionState, field: string, row: number): boolean => {
  if (state?.field !== field) {
    return false;
  }
  if (state.mode === 'fill') {
    return row === state.fillFocusRow;
  }
  return row === Math.max(...selectionRange(state));
};

export {
  clearSelection,
  commitFill,
  extendSelection,
  fillRange,
  isCellFilled,
  isCellSelected,
  isHandleRow,
  selectionRange,
  startFill,
  startSelection,
  toggleSelection,
  updateFill,
};
export type { Selection, SelectionMode, SelectionState };
