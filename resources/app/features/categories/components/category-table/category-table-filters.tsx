import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { categoryListOptions } from '@/features/categories/types';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const CategoryTableFilters = () => {
  const { params, setParam } = useListParams(categoryListOptions);

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

CategoryTableFilters.displayName = 'CategoryTableFilters';

export default CategoryTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
});
