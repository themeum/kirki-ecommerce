import { css } from '@emotion/react';
import { memo } from 'react';

import Button from '@/components/ui/button';
import Capsule from '@/components/ui/capsule';
import Flex from '@/components/ui/flex';
import { useListParamsActions, useListParamsValue } from '@/contexts/list-params-context';
import { theme } from '@/theme';
import type { SuggestionOption } from '@/types';
import { CouponListFilter, couponListFilterConfig, methodOptions, statusOptions, discountTypeOptions } from '@/types/filters/coupon';
import { __ } from '@/wpi18n';

type FilterValue = string | number | Array<string | number>;

const COUPON_FILTER_KEYS = couponListFilterConfig.keys;

type CouponFilterKey = keyof CouponListFilter;

const filterActionBarCss = css({
  flexWrap: 'wrap',
  borderTop: `1px solid ${theme.colors.border.tertiary}`,
  backgroundColor: theme.colors.background.surface,
  padding: theme.spacing[3],
});

const CouponTableFilterAction = memo(() => {
  const params = useListParamsValue<CouponListFilter>();
  const { setParam, setParams } = useListParamsActions<CouponListFilter>();

  const filterOptionsMap: Partial<Record<CouponFilterKey, SuggestionOption[]>> = {
    status: statusOptions,
    method: methodOptions,
    discount_type: discountTypeOptions,
  };

  const activeFilterKeys = COUPON_FILTER_KEYS.filter((key) => {
    const val = params[key];
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    return Boolean(val);
  });

  const getFilterValue = (key: CouponFilterKey): FilterValue =>
    (params[key] || '') as FilterValue;

  const handleFilterChange = (val: FilterValue, key: CouponFilterKey) => {
    setParam(key, val || undefined);
  };

  const handleClearSingleFilter = (key: CouponFilterKey) => {
    setParam(key, undefined);
  };

  const handleClearAll = () => {
    setParams(
      Object.fromEntries(
        COUPON_FILTER_KEYS.map((key) => [key, undefined]),
      ) as Partial<CouponListFilter>,
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
          onValueChange={(val) => handleFilterChange(val as FilterValue, key)}
          onClearItem={() => handleClearSingleFilter(key)}
        />
      ))}
      <Button variant="link" onClick={handleClearAll}>
        {__('Clear All', 'kirki-ecommerce')}
      </Button>
    </Flex>
  );
});

CouponTableFilterAction.displayName = 'CouponTableFilterAction';

export default CouponTableFilterAction;
