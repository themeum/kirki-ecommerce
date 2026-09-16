import { memo } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import InventoryTypeFilter from '@/features/inventory/components/inventory-table/filter-popup/inventory-type-filter';
import type { InventoryListFilter } from '@/features/inventory/types';
import { inventoryListOptions } from '@/features/inventory/types';
import BrandFilter from '@/features/products/components/product-table/filter-popup/brand-filter';
import CategoriesFilter from '@/features/products/components/product-table/filter-popup/categories-filter';
import CollectionFilter from '@/features/products/components/product-table/filter-popup/collection-filter';
import { useFilterDraft } from '@/hooks';

type InventoryFilterDraft = {
  category_ids: number[];
  inventory_type: string;
  collection_id: number | undefined;
  brand_id: number | undefined;
};

const EMPTY_FILTERS: InventoryFilterDraft = {
  category_ids: [],
  inventory_type: 'all',
  collection_id: undefined,
  brand_id: undefined,
};

const FilterPopup = memo(() => {
  const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
    useFilterDraft<InventoryListFilter, InventoryFilterDraft>(inventoryListOptions, EMPTY_FILTERS);

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={handleClose}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '336px' }}
    >
      <CategoriesFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('category_ids', val)}
      />
      <InventoryTypeFilter
        filterObject={draft}
        onChange={(val) => setDraftValue('inventory_type', val)}
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
