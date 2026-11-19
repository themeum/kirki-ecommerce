import { useContext } from 'react';

import type { OrderDetailsContextValue } from '@/features/orders/contexts/order-details-context';
import { OrderDetailsContext } from '@/features/orders/contexts/order-details-context';
import { __ } from '@/wpi18n';

export const useOrderDetails = (): OrderDetailsContextValue => {
  const context = useContext(OrderDetailsContext);

  if (!context) {
    throw new Error(
      __('useOrderDetails must be used within OrderDetailsProvider', 'kirki-ecommerce'),
    );
  }

  return context;
};
