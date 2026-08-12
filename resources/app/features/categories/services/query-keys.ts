import type { ListQueryParams } from '@/types/list-state';

const categoryKeys = {
  all: ['Categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...categoryKeys.details(), String(id)] as const,
};

export { categoryKeys };
