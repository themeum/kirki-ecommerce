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
    title: __('Price', 'kirki-ecommerce'),
    value: 'display_price',
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
    title: __('Available', 'kirki-ecommerce'),
    value: 'available_quantity',
    icon: <DragIcon />,
    isDefault: true,
  },
  {
    title: __('Committed', 'kirki-ecommerce'),
    value: 'committed_quantity',
    icon: <DragIcon />,
    isDefault: true,
  },
];

export type { InventoryTableHeader };
