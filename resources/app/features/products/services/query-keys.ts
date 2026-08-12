import type { ProductListFilter } from '@/features/products/types';
import type { ListParams, ListQueryParams } from '@/types/list-state';

const productKeys = {
  all: ['Products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ListParams<ProductListFilter>) => [...productKeys.lists(), params] as const,
  withVariantsLists: () => [...productKeys.all, 'with-variants'] as const,
  withVariantsList: (params?: ListParams<ProductListFilter>) => [...productKeys.withVariantsLists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), String(id)] as const,
};

const attributeKeys = {
  all: ['Attributes'] as const,
  lists: () => [...attributeKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...attributeKeys.lists(), params] as const,
  details: () => [...attributeKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...attributeKeys.details(), String(id)] as const,
  valuesLists: () => [...attributeKeys.all, 'values'] as const,
  values: (id: string | number, params?: ListQueryParams) => [...attributeKeys.valuesLists(), String(id), params] as const,
};

export { attributeKeys, productKeys };
