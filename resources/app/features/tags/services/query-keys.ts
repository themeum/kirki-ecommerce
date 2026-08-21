import type { ListQueryParams } from '@/types/list-state';

const tagKeys = {
  all: ['Tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...tagKeys.lists(), params] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...tagKeys.details(), String(id)] as const,
};

export { tagKeys };
