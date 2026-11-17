export const reviewsKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewsKeys.all, 'list'] as const,
  list: (params: unknown) => [...reviewsKeys.lists(), params] as const,
  details: () => [...reviewsKeys.all, 'detail'] as const,
  detail: (id: number) => [...reviewsKeys.details(), id] as const,
};
