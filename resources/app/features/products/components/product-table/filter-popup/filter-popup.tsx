import { memo } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import type { ProductListFilter } from '@/features/products';
import { productListOptions } from '@/features/products';
import BrandFilter from '@/features/products/components/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/features/products/components/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/features/products/components/product-table/filter-popup/collection-filter';
import InventoryTypeFilter from '@/features/products/components/product-table/filter-popup/inventory-filter';
import StatusFilter from '@/features/products/components/product-table/filter-popup/status-filter';
import { useFilterDraft } from '@/hooks';

type ProductFilterDraft = {
  category_ids: number[];
  status: string;
  availability_status: string;
  collection_id: number | undefined;
  brand_id: number | undefined;
};

const EMPTY_FILTERS: ProductFilterDraft = {
  category_ids: [],
  status: 'all',
  availability_status: 'all',
  collection_id: undefined,
  brand_id: undefined,
};

const FilterPopup = memo(() => {
  const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
    useFilterDraft<ProductListFilter, ProductFilterDraft>(productListOptions, EMPTY_FILTERS);

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={handleClose}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '400px' }}
    >
      <CategoriesFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('category_ids', val)}
      />
      <StatusFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('status', String(val))}
      />
      <InventoryTypeFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('availability_status', String(val))}
      />
      <CollectionFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('collection_id', Number(val) || undefined)}
      />
      <BrandFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('brand_id', Number(val) || undefined)}
      />
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
