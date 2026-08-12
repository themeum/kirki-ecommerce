import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListParams } from '@/hooks/index';
import { ArrowDownUp, ListFilter } from '@/icons';
import { theme } from '@/theme/index';
import { defineStyles } from '@/theme/mixins';

const CustomerTableAction = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'first_name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  const handleSortChange = () => {
    setParam('sort_order', params.sort_order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value as string)}
        />
      </div>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger cssOverride={styles.selectTrigger}>
            <SelectValue placeholder="Date: This Month" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline">
          <ListFilter />
          Filter
        </Button>
        <Button
          variant="outline"
          aria-label="Sort"
          onClick={handleSortChange}
        >
          <ArrowDownUp />
        </Button>
      </ActionGroup>
    </Flex>
  );
};

CustomerTableAction.displayName = 'CustomerTableAction';

export default CustomerTableAction;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
