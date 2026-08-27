import type { CellContext, Column } from '@tanstack/react-table';
import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react';

import { getPinnedCss, getPinningStyle } from '@/components/data-table/column-styles';
import type { DataTableItem } from '@/components/data-table/types';
import { TableCell } from '@/components/ui/table';
import Tooltip from '@/components/ui/tooltip';
import {
  CheckboxControl,
  MoneyControl,
  NumberControl,
  PlaceholderCellContent,
  ProfileSelectControl,
  ReadonlyMoneyControl,
  ReadonlyNumberControl,
  ShippingBoxControl,
  TextControl,
  UnitPriceControl,
  VariantIdentityControl,
  WeightControl,
} from '@/features/bulk-edit/components/fields/bulk-edit-cell-fields';
import { useBulkEditOptions } from '@/features/bulk-edit/contexts/bulk-edit-options-context';
import {
  useCellSelection,
  useIsActiveCell,
  useIsCellFilled,
  useIsCellSelected,
  useIsHandleCell,
} from '@/features/bulk-edit/contexts/cell-selection-context';
import { useGateOpen } from '@/features/bulk-edit/hooks/use-gate-open';
import { editableKindOf } from '@/features/bulk-edit/lib/editable-kind';
import type { BulkEditProfileOption } from '@/features/bulk-edit/types';
import type { ProductVariant } from '@/features/products';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const renderControl = (
  kind: string | undefined,
  field: string,
  rowIndex: number,
  active: boolean,
  gateOpen: boolean,
  options: {
    taxProfileOptions: BulkEditProfileOption[];
    shippingProfileOptions: BulkEditProfileOption[];
  },
): ReactNode => {
  switch (kind) {
    case 'variant':
      return <VariantIdentityControl rowIndex={rowIndex} />;
    case 'money':
      return <MoneyControl field={field} rowIndex={rowIndex} active={active} />;
    case 'text':
      return <TextControl field={field} rowIndex={rowIndex} active={active} />;
    case 'number':
      return gateOpen ? (
        <NumberControl field={field} rowIndex={rowIndex} active={active} />
      ) : (
        <PlaceholderCellContent />
      );
    case 'checkbox':
      return <CheckboxControl field={field} rowIndex={rowIndex} />;
    case 'readonly-money':
      return <ReadonlyMoneyControl field={field} rowIndex={rowIndex} />;
    case 'readonly-number':
      return <ReadonlyNumberControl field={field} rowIndex={rowIndex} />;
    case 'unit-price':
      return gateOpen ? (
        <UnitPriceControl rowIndex={rowIndex} active={active} />
      ) : (
        <PlaceholderCellContent />
      );
    case 'shipping-box':
      return <ShippingBoxControl rowIndex={rowIndex} active={active} />;
    case 'weight':
      return <WeightControl rowIndex={rowIndex} active={active} />;
    case 'tax-profile':
      return gateOpen ? (
        <ProfileSelectControl
          field={field}
          rowIndex={rowIndex}
          active={active}
          options={options.taxProfileOptions}
        />
      ) : (
        <PlaceholderCellContent />
      );
    case 'shipping-profile':
      return (
        <ProfileSelectControl
          field={field}
          rowIndex={rowIndex}
          active={active}
          options={options.shippingProfileOptions}
        />
      );
    default:
      return null;
  }
};

const BulkEditCell = (context: CellContext<ProductVariant, unknown>) => {
  const { row, column } = context;
  const rowIndex = row.index;
  const field = column.id;
  const meta = column.columnDef.meta;
  const cellKind = meta?.cellKind;
  const selectable = meta?.selectable !== false;

  const selection = useCellSelection();
  const options = useBulkEditOptions();
  const gateOpen = useGateOpen(rowIndex, meta?.gatedBy);

  const isSelected = useIsCellSelected(field, rowIndex);
  const isFilled = useIsCellFilled(field, rowIndex);
  const isHandle = useIsHandleCell(field, rowIndex);
  const isActive = useIsActiveCell(field, rowIndex);

  const pinnedCss = getPinnedCss(column as unknown as Column<DataTableItem, unknown>, false);
  const pinStyle = getPinningStyle(column as unknown as Column<DataTableItem, unknown>);

  const cellRef = useRef<HTMLTableCellElement>(null);

  /**
   * Activation only flips React state (see `activateCell` in
   * cell-selection-context.tsx) — it never itself moves DOM focus. Without
   * this, `pointer-events` unlocking the control is not enough to type into
   * it: the merchant's next keystroke would still land on the `<td>` (which
   * only handles Enter/Escape), not the input, so nothing would happen.
   *
   * For a select-like cell (Tax profile, Shipping profile, Dimension, Base
   * price per unit) the first matched control is a `<button>` trigger, not
   * an `<input>` — focusing it alone leaves its dropdown/dialog closed,
   * still requiring a third click to actually open it. A synthetic `.click()`
   * opens it in the same action that activates the cell, matching the
   * "second click opens it" requirement.
   *
   * A checkbox also renders as a `<button>` (Radix's `role="checkbox"`), but
   * it must NOT get this synthetic click: becoming active is a side effect
   * of the very click that already toggled it (mousedown selects/activates
   * the cell, the following click event toggles the checkbox), so clicking
   * it again here would silently flip it right back — the cell's 2nd click
   * would appear to do nothing.
   */
  useEffect(() => {
    if (!selectable) {
      return;
    }
    if (isActive) {
      const control = cellRef.current?.querySelector<HTMLElement>('input, button');
      control?.focus({ preventScroll: true });
      if (control instanceof HTMLButtonElement && cellKind !== 'checkbox') {
        control.click();
      }
      return;
    }
    if (isSelected) {
      cellRef.current?.focus({ preventScroll: true });
    }
  }, [isSelected, isActive, selectable, cellKind]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>) => {
    if (!selectable) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selection.activateCell(field, rowIndex);
    }
    if (event.key === 'Escape') {
      selection.deactivateCell();
    }
  };

  return (
    <TableCell
      ref={cellRef}
      cssOverride={mergeCss(styles.cell, pinnedCss)}
      style={{ width: column.getSize(), ...pinStyle }}
      alignment={meta?.alignment}
      tabIndex={selectable ? 0 : undefined}
      data-bulk-row={selectable ? rowIndex : undefined}
      data-bulk-field={selectable ? field : undefined}
      data-bulk-editable-kind={selectable ? editableKindOf(cellKind) : undefined}
      data-bulk-cell={isFilled ? 'fill' : isSelected ? 'selected' : undefined}
      data-cell-kind={cellKind}
      onMouseDown={
        selectable
          ? (event) =>
              selection.onCellMouseDown(
                field,
                rowIndex,
                true,
                event.shiftKey,
                event.metaKey || event.ctrlKey,
              )
          : undefined
      }
      onMouseEnter={
        selectable ? () => selection.onCellMouseEnter(field, rowIndex, true) : undefined
      }
      onDoubleClick={selectable ? () => selection.activateCell(field, rowIndex) : undefined}
      onKeyDown={handleKeyDown}
    >
      {renderControl(cellKind, field, rowIndex, isActive, gateOpen, options)}
      {isHandle && selectable && cellKind !== 'variant' && (
        <Tooltip
          tip={__('Drag to fill', 'kirki-ecommerce')}
          position="top"
          cssOverride={styles.grabberTrigger}
        >
          <span
            role="presentation"
            data-grabber="true"
            css={scoped(styles.grabber)}
            onMouseDown={(event) => {
              event.stopPropagation();
              selection.onGrabberMouseDown(field, rowIndex);
            }}
          />
        </Tooltip>
      )}
    </TableCell>
  );
};

BulkEditCell.displayName = 'BulkEditCell';

export default BulkEditCell;

const styles = defineStyles({
  cell: {
    // A real `border` on a table cell is painted outside its computed
    // box in the browser's table layout algorithm — a `height: 32` cell
    // with a 1px `borderBottom` measures 33px regardless of box-sizing,
    // because the row-height computation (driven by <tr>'s own explicit
    // height) treats `height` as a minimum and adds the border on top.
    // `box-shadow: inset` paints inside the existing box instead, so it
    // never affects layout size — same reasoning bulk-edit-grid-polish
    // already applied to the selection/fill indicator via `outline`.
    height: 32,
    boxShadow: `inset 0 -1px 0 ${theme.colors.border.default}`,
    // Actual padding comes from bulk-edit-table.tsx's `styles.table['& td']`
    // — a Table-level override, needed because the shared `Table` component's
    // own `'& th, & td'` base padding rule out-specificities a per-cell one.
    position: 'relative',
    verticalAlign: 'middle',
    overflow: 'visible',
    borderRight: `1px solid ${theme.colors.border.default}`,
    transition: 'background-color 0.3s ease-in-out, outline 0.3s ease-in-out',
    '&:focus-visible': {
      outline: '0px solid transparent',
    },
    '&[data-bulk-cell="selected"]': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: -1,
      backgroundColor: `rgba(22, 123, 255, 0.15)`,
    },
    '&[data-bulk-cell="fill"]': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: -1,
      backgroundColor: theme.colors.background.fillSecondary,
    },

    '&:has(input[readonly])': {
      cursor: 'not-allowed',
      backgroundColor: 'rgba(0, 0, 0, 0.015)',
    },

    '&[data-cell-kind="variant"]': {
      paddingLeft: theme.spacing[3],
    },
  },
  /**
   * `Tooltip`'s trigger wrapper renders as an in-flow `inline-flex` span —
   * even though the grabber inside it is absolutely positioned, that
   * wrapper span was still occupying its own line-box height inside the
   * cell's block flow, silently growing the cell past its fixed 32px height
   * whenever a handle rendered. Positioning the wrapper itself (via
   * `Tooltip`'s `cssOverride`) removes it from flow entirely; the grabber
   * span inside just needs to fill that positioned box.
   */
  grabberTrigger: {
    position: 'absolute',
    right: -4,
    bottom: -4,
  },
  grabber: {
    width: 6,
    height: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fillBrand,
    cursor: 's-resize',
    zIndex: 2,
  },
});
