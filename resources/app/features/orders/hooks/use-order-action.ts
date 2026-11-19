import { useContext } from 'react';

import type { OrderActionContextValue } from '@/features/orders/contexts/order-action-context';
import { OrderActionContext } from '@/features/orders/contexts/order-action-context';
import { __ } from '@/wpi18n';

export const useOrderAction = (): OrderActionContextValue => {
  const context = useContext(OrderActionContext);

  if (!context) {
    throw new Error(__('useOrderAction must be used within OrderActionProvider', 'kirki-ecommerce'));
  }

  return context;
};
