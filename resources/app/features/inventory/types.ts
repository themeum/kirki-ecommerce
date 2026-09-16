import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseNumber, parseNumberArray, parseString } from '@/types/list-state';
import type { SuggestionOption } from '@/types/pages/common';
import { __ } from '@/wpi18n';

export type InventoryListFilter = {
  search?: string;
  category_ids?: number[];
  brand_id?: number;
  collection_id?: number;
  inventory_type?: string;
  from_date?: string | null;
  to_date?: string | null;
};

const inventoryListFilterConfig: ListFilterConfig<InventoryListFilter> = {
  keys: ['search', 'category_ids', 'brand_id', 'collection_id', 'inventory_type'],
  parsers: {
    search: { parse: parseString },
    category_ids: { parse: parseNumberArray },
    brand_id: { parse: parseNumber },
    collection_id: { parse: parseNumber },
    inventory_type: { parse: parseString },
  },
};

const inventoryListOptions: UseListParamsOptions<InventoryListFilter> = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: inventoryListFilterConfig,
};

const inventoryTypeOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'in_stock', title: __('In stock', 'kirki-ecommerce') },
  { value: 'out_of_stock', title: __('Out of stock', 'kirki-ecommerce') },
];

export { inventoryListOptions, inventoryTypeOptions };
