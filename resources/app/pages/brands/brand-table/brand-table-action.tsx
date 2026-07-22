import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { useListParams } from '@/hooks';

const BrandTableAction = () => {
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

BrandTableAction.displayName = 'BrandTableAction';

export default BrandTableAction;
