import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { brandListOptions } from '@/features/brands/types';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const BrandTableFilters = () => {
  const { params, setParam } = useListParams(brandListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
        />
      </div>
    </Flex>
  );
};

BrandTableFilters.displayName = 'BrandTableFilters';

export default BrandTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
});
