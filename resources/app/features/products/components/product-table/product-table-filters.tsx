import { memo } from 'react';

import ActionGroup from '@/components/ui/action-group';
import { DateRangePicker } from '@/components/ui/calendar';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { productListOptions } from '@/features/products';
import FilterPopup from '@/features/products/components/product-table/filter-popup/filter-popup';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const ProductTableFilter = memo(() => {
  const { params, setParam, handleDateFilter } = useDataTableParams(productListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };



  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
          delay={500}
        />
      </div>
      <ActionGroup>
        <DateRangePicker
          value={{
            from: isDefined(params.from_date) ? new Date(params.from_date) : null,
            to: isDefined(params.to_date) ? new Date(params.to_date) : null,
          }}
          presets
          clearable
          onChange={handleDateFilter}
          size="sm"
        />
        <FilterPopup />
      </ActionGroup>
    </Flex>
  );
});

ProductTableFilter.displayName = 'ProductTableFilter';

export default ProductTableFilter;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
