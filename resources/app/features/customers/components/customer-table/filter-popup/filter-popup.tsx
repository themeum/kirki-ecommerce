import { memo } from 'react';

import DataTableFilterPopover from '@/components/data-table/data-table-filter-popover';
import LocationFilter from '@/features/customers/components/customer-table/filter-popup/location-filter';
import type { CustomerListFilter } from '@/features/customers/types';
import { customerListOptions } from '@/features/customers/types';
import { useFilterDraft } from '@/hooks';

type CustomerFilterDraft = {
  country: string;
  city: string;
};

const EMPTY_FILTERS: CustomerFilterDraft = {
  country: 'all',
  city: 'all',
};

const FilterPopup = memo(() => {
  const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
    useFilterDraft<CustomerListFilter, CustomerFilterDraft>(customerListOptions, EMPTY_FILTERS);

  return (
    <DataTableFilterPopover
      appliedCount={appliedCount}
      onOpen={handleOpen}
      onClose={handleClose}
      onApply={handleApply}
      onClear={handleClear}
      contentCssOverride={{ minHeight: '208px' }}
    >
      <LocationFilter
        filterObject={draft}
        onCountryChange={(val) => setDraftValue('country', val)}
        onCityChange={(val) => setDraftValue('city', val)}
      />
    </DataTableFilterPopover>
  );
});

FilterPopup.displayName = 'FilterPopup';

export default FilterPopup;
