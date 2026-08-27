import type { UseListParamsOptions } from '@/hooks/use-list-params';

const tagListOptions: UseListParamsOptions = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 10,
  },
};

export { tagListOptions };
