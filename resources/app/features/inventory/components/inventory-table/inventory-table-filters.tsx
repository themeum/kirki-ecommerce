import ActionGroup from '@/components/ui/action-group';
import { DateRangePicker } from '@/components/ui/calendar';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { inventoryListOptions } from '@/features/inventory/types';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const InventoryTableFilters = () => {
  const { params, setParam, handleDateFilter } = useDataTableParams(inventoryListOptions);

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          onChange={(value) => setParam('search', value)}
          value={params.search}
          placeholder={__('Search Products', 'kirki-ecommerce')}
          clearable
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
      </ActionGroup>
    </Flex>
  );
};

InventoryTableFilters.displayName = 'InventoryTableFilters';

export default InventoryTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
