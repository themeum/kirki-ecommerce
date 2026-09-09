import { type ComponentProps, memo, useState } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import type Button from '@/components/ui/button';
import type { ProductListFilter } from '@/features/products';
import { productListOptions } from '@/features/products';
import BrandFilter from '@/features/products/components/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/features/products/components/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/features/products/components/product-table/filter-popup/collection-filter';
import InventoryTypeFilter from '@/features/products/components/product-table/filter-popup/inventory-filter';
import StatusFilter from '@/features/products/components/product-table/filter-popup/status-filter';
import { useListParams } from '@/hooks';
import { noop } from '@/utils/function';

type LocalFilterState = {
  category_ids: number[];
  status: string;
  availability_status: string;
  collection_ids: number | undefined;
  brand_ids: number | undefined;
};

type FilterPopupProps = {
  onChange?: () => void;
  buttonProps?: ComponentProps<typeof Button>;
  data?: unknown;
};

const EMPTY_FILTERS: LocalFilterState = {
  category_ids: [],
  status: 'all',
  availability_status: 'all',
  collection_ids: undefined,
  brand_ids: undefined,
};

const FilterPopup = memo(({ onChange: _onChange = noop, data: _data }: FilterPopupProps) => {
  const { params, setParams } = useListParams<ProductListFilter>(productListOptions);
  const [filterObject, setFilterObject] = useState<LocalFilterState>(EMPTY_FILTERS);

  const appliedCount = [
    params.category_ids?.length,
    params.status,
    params.availability_status,
    params.collection_ids?.length,
    params.brand_ids?.length,
  ].filter(Boolean).length;

  const handleOpen = () => {
    setFilterObject({
      category_ids: params.category_ids ?? [],
      status: (params.status as string) || 'all',
      availability_status: params.availability_status || 'all',
      collection_ids: params.collection_ids?.[0],
      brand_ids: params.brand_ids?.[0],
    });
  };

  const handleOnFilterChange = (
    val: string | number | (string | number)[],
    filterName: keyof LocalFilterState,
  ) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleApply = () => {
    setParams({
      category_ids: filterObject.category_ids.length ? filterObject.category_ids : undefined,
      status:
        filterObject.status && filterObject.status !== 'all' ? filterObject.status : undefined,
      availability_status:
        filterObject.availability_status && filterObject.availability_status !== 'all'
          ? filterObject.availability_status
          : undefined,
      collection_ids: filterObject.collection_ids ? [filterObject.collection_ids] : undefined,
      brand_ids: filterObject.brand_ids ? [filterObject.brand_ids] : undefined,
    });
  };

  const handleClear = () => {
    setFilterObject(EMPTY_FILTERS);
    setParams({
      category_ids: undefined,
      status: undefined,
      availability_status: undefined,
      collection_ids: undefined,
      brand_ids: undefined,
    });
  };

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={() => setFilterObject(EMPTY_FILTERS)}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '400px' }}
    >
      <CategoriesFilter
        filterObject={filterObject}
        onChange={(val) => handleOnFilterChange(val, 'category_ids')}
      />
      <StatusFilter
        filterObject={filterObject}
        onChange={(val) => handleOnFilterChange(val, 'status')}
      />
      <InventoryTypeFilter
        filterObject={filterObject}
        onChange={(val) => handleOnFilterChange(val, 'availability_status')}
      />
      <CollectionFilter
        filterObject={filterObject}
        onChange={(val) => handleOnFilterChange(val, 'collection_ids')}
      />
      <BrandFilter
        filterObject={filterObject}
        onChange={(val) => handleOnFilterChange(val, 'brand_ids')}
      />
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
