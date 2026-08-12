import type { ListQueryParams } from '@/types/list-state';

const brandKeys = {
  all: ['Brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...brandKeys.lists(), params] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...brandKeys.details(), String(id)] as const,
};

export { brandKeys };
