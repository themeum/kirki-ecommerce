import { memo } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/calendar';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { orderListOptions } from '@/features/orders';
import FilterPopup from '@/features/orders/components/order-table/filter-popup/filter-popup';
import { useDataTableParams } from '@/hooks';
import { ArrowDownUp } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const OrderTableAction = memo(() => {
  const { params, setParam, handleDateFilter } = useDataTableParams(orderListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '160px' }}>
        <Searchbox
          placeholder={__('Search', 'kirki-ecommerce')}
          value={params.search || ''}
          delay={500}
          onChange={(value) => handleSearchChange(value as string)}
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
        />
        <FilterPopup />
        <Button variant="outline" aria-label={__('Sort', 'kirki-ecommerce')} onClick={handleSortChange}>
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
});

OrderTableAction.displayName = 'OrderTableAction';

export default OrderTableAction;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
});
