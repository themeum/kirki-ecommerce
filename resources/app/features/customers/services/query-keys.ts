import type { ListQueryParams } from '@/types/list-state';

const customerKeys = {
  all: ['Customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...customerKeys.details(), String(id)] as const,
};

export { customerKeys };
