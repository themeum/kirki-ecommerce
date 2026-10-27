import { useContext } from 'react';

import type { OrderEditContextValue } from '@/features/orders/contexts/order-edit-context';
import { OrderEditContext } from '@/features/orders/contexts/order-edit-context';
import { __ } from '@/wpi18n';

export const useOrderEdit = (): OrderEditContextValue => {
  const context = useContext(OrderEditContext);

  if (!context) {
    throw new Error(__('useOrderEdit must be used within OrderEditProvider', 'kirki-ecommerce'));
  }

  return context;
};
