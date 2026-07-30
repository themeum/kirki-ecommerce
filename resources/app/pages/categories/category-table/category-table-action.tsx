import type { CSSObject } from '@emotion/react';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
;

const CategoryTableAction = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

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

CategoryTableAction.displayName = 'CategoryTableAction';

export default CategoryTableAction;

const styles = {
  wrapper: ({
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  } satisfies CSSObject),
};
