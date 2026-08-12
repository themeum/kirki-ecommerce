import type { ListQueryParams } from '@/types/list-state';

const collectionKeys = {
  all: ['Collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...collectionKeys.lists(), params] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...collectionKeys.details(), String(id)] as const,
};

export { collectionKeys };
