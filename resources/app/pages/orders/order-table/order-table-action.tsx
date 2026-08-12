import { memo } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { useListParams } from '@/hooks';
import { ArrowDownUp } from '@/icons';
import FilterPopup from '@/pages/orders/order-table/filter-popup/filter-popup';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { OrderListFilter} from '@/types/filters/order';
import { orderListOptions } from '@/types/filters/order';
import { __ } from '@/wpi18n';

const OrderTableAction = memo(() => {
  const { params, setParam } = useListParams<OrderListFilter>(orderListOptions);

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
