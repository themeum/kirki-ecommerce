import ActionGroup from '@/components/ui/action-group';
import { DateRangePicker } from '@/components/ui/calendar';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const CollectionTableFilters = () => {
  const { params, setParam, handleDateFilter } = useDataTableParams(collectionListOptions);

  const handleSearchChange = (value: string | number) => {
    setParam('search', value);
  };


  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value)}
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
