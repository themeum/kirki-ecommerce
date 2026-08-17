import type { ReactNode } from 'react';

import { DragIcon } from '@/icons';
import type { TableAlignment } from '@/types/components/common';
import { __ } from '@/wpi18n';

type InventoryTableHeader = {
  title: string;
  value: string;
  icon: ReactNode;
  isDefault?: boolean;
  alignment?: TableAlignment;
};

export const allTableHeaders: InventoryTableHeader[] = [
  {
    title: __('Variants', 'kirki-ecommerce'),
    value: 'title',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('SKU', 'kirki-ecommerce'),
    value: 'sku',
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
  },
  {
    title: __('Profit', 'kirki-ecommerce'),
    value: 'profit',
    icon: <DragIcon />,
  },
];

export type { InventoryTableHeader };
