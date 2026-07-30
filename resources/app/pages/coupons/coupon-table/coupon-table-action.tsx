import { memo } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useListParamsActions,
  useListParamsValue,
} from '@/contexts/list-params-context';
import { ArrowDownUp } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import FilterPopup from '@/pages/coupons/coupon-table/filter-popup/filter-popup';
import { CouponListFilter } from '@/types/filters/coupon';

const CouponTableAction = memo(() => {
  const params = useListParamsValue<CouponListFilter>();
  const { setParam } = useListParamsActions<CouponListFilter>();

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Flex css={styles.wrapper}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
          delay={500}
        />
      </div>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger css={styles.selectTrigger}>
            <SelectValue placeholder={__('Date: This Month', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <FilterPopup />
        <Button
          variant="outline"
          aria-label={__('Sort', 'kirki-ecommerce')}
          onClick={handleSortChange}
        >
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
});

CouponTableAction.displayName = 'CouponTableAction';

export default CouponTableAction;

const styles = {
  wrapper: scoped({
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  }),
  selectTrigger: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  }),
};
