import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CollectionTableFilters = () => {
  const { params, setParam } = useDataTableParams(collectionListOptions);

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
