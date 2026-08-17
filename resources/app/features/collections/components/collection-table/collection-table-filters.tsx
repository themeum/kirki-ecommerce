import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import type { DateRangeValue } from '@/components/ui/calendar';
import { DateRangePicker } from '@/components/ui/calendar';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { ArrowDownUp } from '@/icons';
import { formatDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const CollectionTableFilters = () => {
  const { params, setParam, setParams } = useDataTableParams(collectionListOptions);

  const handleSearchChange = (value: string | number) => {
    setParam('search', value);
  };

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  const handleDateChange = (value: DateRangeValue | null) => {
    if (!isDefined(value) || !isDefined(value.from)) {
      setParams({
        from_date: null,
        to_date: null,
      });
      return;
    }

    setParams({
      from_date: formatDateValue(value.from),
      to_date: formatDateValue(!isDefined(value.to) ? value.from : value.to),
    });
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value)}
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
          onChange={handleDateChange}
        />
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
};

CollectionTableFilters.displayName = 'CollectionTableFilters';

export default CollectionTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
