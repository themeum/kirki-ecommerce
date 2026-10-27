import { useContext } from 'react';

import type { OrderCreateContextValue } from '@/features/orders/contexts/order-create-context';
import { OrderCreateContext } from '@/features/orders/contexts/order-create-context';
import { __ } from '@/wpi18n';

export const useOrderCreate = (): OrderCreateContextValue => {
  const context = useContext(OrderCreateContext);

  if (!context) {
    throw new Error(__('useOrderCreate must be used within OrderCreateProvider', 'kirki-ecommerce'));
  }

  return context;
};
