import { memo } from 'react';

import Button from '@/components/ui/button';
import Capsule from '@/components/ui/capsule';
import Flex from '@/components/ui/flex';
import type { OrderListFilter } from '@/features/orders';
import { fulfillmentStatusOptions, orderListFilterConfig, orderListOptions, paymentStatusOptions } from '@/features/orders';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { SuggestionOption } from '@/types/pages/common';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type FilterValue = string | number | (string | number)[];

const ORDER_FILTER_KEYS = orderListFilterConfig.keys;

type OrderFilterKey = keyof OrderListFilter;

const filterActionBarCss = defineStyles({
  flexWrap: 'wrap',
  borderTop: `1px solid ${theme.colors.border.tertiary}`,
  backgroundColor: theme.colors.background.surface,
  padding: theme.spacing[3],
});

const OrderTableFilterBar = memo(() => {
  const { params, setParam, setParams } = useDataTableParams(orderListOptions);

  const filterOptionsMap: Partial<Record<OrderFilterKey, SuggestionOption[]>> = {
    fulfillment_status: fulfillmentStatusOptions,
    payment_status: paymentStatusOptions,
  };

  const activeFilterKeys = ORDER_FILTER_KEYS.filter((key) => {
    const val = params[key];
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    return Boolean(val);
  });

  const getFilterValue = (key: OrderFilterKey): FilterValue => {
    if (!isDefined(params[key])) {
      return '';
    }

    return params[key];
  }


  const handleFilterChange = (val: FilterValue, key: OrderFilterKey) => {
    setParam(key, val || undefined);
  };

  const handleClearSingleFilter = (key: OrderFilterKey) => {
    setParam(key, undefined);
  };

  const handleClearAll = () => {
    setParams(
      Object.fromEntries(
        ORDER_FILTER_KEYS.map((key) => [key, undefined]),
      ),
    );
  };

  if (!activeFilterKeys.length) {
    return null;
  }

  return (
    <Flex gap={3} cssOverride={filterActionBarCss}>
      {activeFilterKeys.map((key) => (
        <Capsule
          key={key}
          uniqueKey={key}
          optionsArray={filterOptionsMap[key]}
          value={getFilterValue(key)}
          onValueChange={(val) => handleFilterChange(val, key)}
          onClearItem={() => handleClearSingleFilter(key)}
        />
      ))}
      <Button variant="link" onClick={handleClearAll}>
        {__('Clear All', 'kirki-ecommerce')}
      </Button>
    </Flex>
  );
});

OrderTableFilterBar.displayName = 'OrderTableFilterBar';

export default OrderTableFilterBar;
