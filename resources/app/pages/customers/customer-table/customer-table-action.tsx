import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { useListParams } from '@/hooks';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

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
    <Flex css={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(value as string)}
        />
      </div>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger css={styles.selectTrigger}>
            <SelectValue placeholder="Date: This Month" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="outline" size="sm">
          <ListFilter />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
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

const styles = {
  wrapper: scoped({
    padding: `${theme.spacing['2xl']} ${theme.spacing.lg}`,
  }),
  selectTrigger: scoped({
    padding: `${theme.spacing.md} ${theme.spacing['2xl']}`,
  }),
};
