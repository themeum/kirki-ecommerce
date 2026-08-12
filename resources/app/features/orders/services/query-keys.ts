import type { OrderCalculationRequestPayload } from '@/features/orders/schemas/forms/order-form';
import type { OrderListFilter } from '@/features/orders/types';
import type { ListParams } from '@/types/list-state';

const orderKeys = {
  all: ['Orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: ListParams<OrderListFilter>) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...orderKeys.details(), String(id)] as const,
  calculation: (payload?: OrderCalculationRequestPayload) => [...orderKeys.all, 'calculation', payload] as const,
};

export { orderKeys };
