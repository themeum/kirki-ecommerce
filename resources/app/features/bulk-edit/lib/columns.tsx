import type { ColumnDef } from '@tanstack/react-table';

import BulkEditCell from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-cell';
import type { ProductVariant } from '@/features/products';
import { __ } from '@/wpi18n';

type BulkEditCellKind =
  | 'variant'
  | 'money'
  | 'readonly-money'
  | 'checkbox'
  | 'unit-price'
  | 'text'
  | 'shipping-box'
  | 'weight'
  | 'number'
  | 'readonly-number'
  | 'tax-profile'
  | 'shipping-profile';

type BulkEditGate = 'track_inventory' | 'has_limit_per_order' | 'charge_taxes' | 'show_unit_price';

const ROW_HEIGHT = 32;

const bulkEditColumns: ColumnDef<ProductVariant>[] = [
  {
    id: 'variant',
    header: __('Variants', 'kirki-ecommerce'),
    size: 400,
    enablePinning: true,
    meta: { cellKind: 'variant', selectable: false },
    cell: BulkEditCell,
  },
  {
    id: 'base_price',
    header: __('Price', 'kirki-ecommerce'),
    size: 140,
    meta: { cellKind: 'money', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'base_sale_price',
    header: __('Sale Price', 'kirki-ecommerce'),
    size: 140,
    meta: { cellKind: 'money', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'base_cost_of_goods',
    header: __('Cost of Goods', 'kirki-ecommerce'),
    size: 140,
    meta: { cellKind: 'money', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'profit',
    header: __('Profit', 'kirki-ecommerce'),
    size: 110,
    meta: { cellKind: 'readonly-money', selectable: false, alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'margin',
    header: __('Margin (%)', 'kirki-ecommerce'),
    size: 100,
    meta: { cellKind: 'readonly-money', selectable: false, alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'show_unit_price',
    header: __('Unit price', 'kirki-ecommerce'),
    size: 100,
    meta: { cellKind: 'checkbox', alignment: 'center' },
    cell: BulkEditCell,
  },
  {
    id: 'base_price_per_unit',
    header: __('Base price per unit', 'kirki-ecommerce'),
    size: 220,
    meta: { cellKind: 'unit-price', gatedBy: 'show_unit_price' },
    cell: BulkEditCell,
  },
  {
    id: 'sku',
    header: __('SKU', 'kirki-ecommerce'),
    size: 160,
    meta: { cellKind: 'text' },
    cell: BulkEditCell,
  },
  {
    id: 'shipping_box_id',
    header: __('Dimension', 'kirki-ecommerce'),
    size: 300,
    meta: { cellKind: 'shipping-box' },
    cell: BulkEditCell,
  },
  {
    id: 'weight',
    header: __('Weight', 'kirki-ecommerce'),
    size: 160,
    meta: { cellKind: 'weight' },
    cell: BulkEditCell,
  },
  {
    id: 'track_inventory',
    header: __('Track Inventory', 'kirki-ecommerce'),
    size: 130,
    meta: { cellKind: 'checkbox', alignment: 'center' },
    cell: BulkEditCell,
  },
  {
    id: 'available_quantity',
    header: __('Availability', 'kirki-ecommerce'),
    size: 120,
    meta: { cellKind: 'number', gatedBy: 'track_inventory', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'committed_quantity',
    header: __('Committed', 'kirki-ecommerce'),
    size: 110,
    meta: { cellKind: 'readonly-number', selectable: false, alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'low_stock_threshold',
    header: __('Low Stock Threshold', 'kirki-ecommerce'),
    size: 160,
    meta: { cellKind: 'number', gatedBy: 'track_inventory', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'has_limit_per_order',
    header: __('Limit Purchase', 'kirki-ecommerce'),
    size: 130,
    meta: { cellKind: 'checkbox', alignment: 'center' },
    cell: BulkEditCell,
  },
  {
    id: 'max_per_order',
    header: __('Limit', 'kirki-ecommerce'),
    size: 100,
    meta: { cellKind: 'number', gatedBy: 'has_limit_per_order', alignment: 'right' },
    cell: BulkEditCell,
  },
  {
    id: 'is_visible',
    header: __('Visibility', 'kirki-ecommerce'),
    size: 100,
    meta: { cellKind: 'checkbox', alignment: 'center' },
    cell: BulkEditCell,
  },
  {
    id: 'charge_taxes',
    header: __('Charge Tax', 'kirki-ecommerce'),
    size: 110,
    meta: { cellKind: 'checkbox', alignment: 'center' },
    cell: BulkEditCell,
  },
  {
    id: 'tax_profile_id',
    header: __('Tax profile', 'kirki-ecommerce'),
    size: 180,
    meta: { cellKind: 'tax-profile', gatedBy: 'charge_taxes' },
    cell: BulkEditCell,
  },
  {
    id: 'shipping_profile_id',
    header: __('Shipping Profile', 'kirki-ecommerce'),
    size: 180,
    meta: { cellKind: 'shipping-profile' },
    cell: BulkEditCell,
  },
];

export { bulkEditColumns, ROW_HEIGHT };
export type { BulkEditCellKind, BulkEditGate };
