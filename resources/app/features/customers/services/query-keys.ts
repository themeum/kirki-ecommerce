import type { CustomerListFilter } from '@/features/customers/types';
import type { ListParams } from '@/types/list-state';

const customerKeys = {
  all: ['Customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: ListParams<CustomerListFilter>) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...customerKeys.details(), String(id)] as const,
  locations: (country?: string) => [...customerKeys.all, 'locations', country ?? null] as const,
};

export { customerKeys };
