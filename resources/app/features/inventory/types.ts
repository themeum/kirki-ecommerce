import type { UseListParamsOptions } from '@/hooks/use-list-params';

const inventoryListOptions: UseListParamsOptions = {
  defaults: {
    sort_by: 'id',
    sort_order: 'asc',
    page: 1,
    limit: 20,
  },
};

export { inventoryListOptions };
