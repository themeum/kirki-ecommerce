import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseNumberArray, parseStatus, parseString } from '@/types/list-state';

type UnitPriceValue = {
  total_unit_amount?: number | string | null;
  total_unit?: string | null;
  base_unit_amount?: number | string | null;
  base_unit?: string | null;
};

type UpdateVariantsPayload = {
  key: string;
  value: unknown;
  variant_index?: number[];
};

export type { UnitPriceValue, UpdateVariantsPayload };

export type ProductListFilter = {
  search?: string;
  category_ids?: number[];
  brand_ids?: number[];
  collection_ids?: number[];
  status?: string | string[];
  availability_status?: string;
  inventory_type?: string;
  from_date?: string | null;
  to_date?: string | null;
};

const productListFilterConfig: ListFilterConfig<ProductListFilter> = {
  keys: [
    'search',
    'category_ids',
    'brand_ids',
    'collection_ids',
    'status',
    'availability_status',
    'inventory_type',
  ],
  parsers: {
    search: { parse: parseString },
    category_ids: { parse: parseNumberArray },
    brand_ids: { parse: parseNumberArray },
    collection_ids: { parse: parseNumberArray },
    status: { parse: parseStatus },
    availability_status: { parse: parseString },
    inventory_type: { parse: parseString },
  },
};

const productListOptions: UseListParamsOptions<ProductListFilter> = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: productListFilterConfig,
};

export { productListFilterConfig, productListOptions };
