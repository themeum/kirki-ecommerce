import type { ListQueryParams } from '@/types/list-state';

const inventoryKeys = {
  all: ['Inventory'] as const,
  list: (params?: ListQueryParams) => [...inventoryKeys.all, params] as const,
};

export { inventoryKeys };
