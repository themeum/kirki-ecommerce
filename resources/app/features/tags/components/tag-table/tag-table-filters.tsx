import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { tagListOptions } from '@/features/tags/types';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const TagTableFilters = () => {
  const { params, setParam } = useListParams(tagListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(String(value))}
          value={params.search || ''}
          clearable
        />
      </div>
    </Flex>
  );
};

TagTableFilters.displayName = 'TagTableFilters';

export default TagTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
});
