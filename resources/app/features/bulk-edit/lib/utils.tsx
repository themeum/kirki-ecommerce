import type { ReactNode } from 'react';

import { DragIcon } from '@/icons';
import type { TableAlignment } from '@/types/components/common';
import { __ } from '@/wpi18n';

type BulkEditTableHeader = {
  title: string;
  value: string;
  icon: ReactNode;
  isDefault?: boolean;
  alignment?: TableAlignment;
};

export const allTableHeaders: BulkEditTableHeader[] = [
  {
    title: __('Variants', 'kirki-ecommerce'),
    value: 'title',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Price', 'kirki-ecommerce'),
    value: 'base_price',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Sale Price', 'kirki-ecommerce'),
    value: 'base_sale_price',
    icon: <DragIcon />,
  },
  {
    title: __('Cost of Goods', 'kirki-ecommerce'),
    value: 'base_cost_of_goods',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Profit', 'kirki-ecommerce'),
    value: 'profit',
    icon: <DragIcon />,
  },
  {
    title: __('Margin', 'kirki-ecommerce'),
    value: 'margin',
    icon: <DragIcon />,
  },
  {
    title: __('Unit Price', 'kirki-ecommerce'),
    alignment: 'center',
    value: 'show_unit_price',
    icon: <DragIcon />,
  },
  {
    title: __('Base price per unit', 'kirki-ecommerce'),
    value: 'base_price_per_unit',
    icon: <DragIcon />,
  },
  {
    title: __('SKU', 'kirki-ecommerce'),
    value: 'sku',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Shipping Box', 'kirki-ecommerce'),
    value: 'shipping_box_id',
    icon: <DragIcon />,
  },
  {
    title: __('Weight', 'kirki-ecommerce'),
    value: 'weight',
    icon: <DragIcon />,
  },
  {
    title: __('Weight Unit', 'kirki-ecommerce'),
    value: 'weight_unit',
    icon: <DragIcon />,
  },
  {
    title: __('Track Inventory', 'kirki-ecommerce'),
    alignment: 'center',
    value: 'track_inventory',
    icon: <DragIcon />,
  },
  {
    title: __('Quantity', 'kirki-ecommerce'),
    value: 'available_quantity',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Committed', 'kirki-ecommerce'),
    value: 'committed_quantity',
    icon: <DragIcon />,
  },
  {
    title: __('Low stock threshold', 'kirki-ecommerce'),
    value: 'low_stock_threshold',
    icon: <DragIcon />,
  },
  {
    title: __('Limit Purchase', 'kirki-ecommerce'),
    alignment: 'center',
    value: 'has_limit_per_order',
    icon: <DragIcon />,
  },
  {
    title: __('Limit', 'kirki-ecommerce'),
    value: 'max_per_order',
    icon: <DragIcon />,
  },
  {
    title: __('Visibility', 'kirki-ecommerce'),
    alignment: 'center',
    value: 'is_visible',
    icon: <DragIcon />,
  },
  {
    title: __('Charge Tax', 'kirki-ecommerce'),
    alignment: 'center',
    value: 'charge_taxes',
    icon: <DragIcon />,
  },
  {
    title: __('Tax profile', 'kirki-ecommerce'),
    value: 'tax_profile_id',
    icon: <DragIcon />,
  },
  {
    title: __('Shipping Profile', 'kirki-ecommerce'),
    value: 'shipping_profile_id',
    icon: <DragIcon />,
  },
];

export type { BulkEditTableHeader };
