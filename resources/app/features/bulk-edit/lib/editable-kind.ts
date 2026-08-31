type EditableKind = 'text' | 'number' | 'money' | 'checkbox' | 'other';

/**
 * Normalizes a column's `cellKind` into the coarse bucket the selection
 * context's keydown listener needs to decide whether a keystroke/Space press
 * targets a typeable field or a checkbox — read off the DOM via
 * `data-bulk-editable-kind` rather than importing column definitions into
 * cell-selection-context.tsx, mirroring how it already reads
 * `data-bulk-row`/`data-bulk-field`.
 */
const editableKindOf = (cellKind: string | undefined): EditableKind => {
  switch (cellKind) {
    case 'text':
      return 'text';
    case 'number':
      return 'number';
    case 'money':
      return 'money';
    case 'weight':
      return 'number';
    case 'checkbox':
      return 'checkbox';
    default:
      return 'other';
  }
};

export { editableKindOf };
export type { EditableKind };
