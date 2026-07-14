import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { useListParams } from '@/hooks';

const TagTableAction = () => {
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
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
        />
      </div>
    </Flex>
  );
};

TagTableAction.displayName = 'TagTableAction';

export default TagTableAction;
