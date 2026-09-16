import type { ListQueryParams } from '@/types/list-state';

const inventoryKeys = {
  all: ['Inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...inventoryKeys.lists(), params] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...inventoryKeys.details(), String(id)] as const,
};

export { inventoryKeys };
