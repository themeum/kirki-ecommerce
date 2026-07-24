import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { SelectOption } from '@/types';

const OrderTableAction = () => {
  const selectOptions: SelectOption[] = [
    { value: 'all', title: 'All Orders' },
    { value: 'new', title: 'New Orders' },
    { value: 'top', title: 'Top Orders' },
  ];

  return (
    <Flex css={styles.wrapper}>
      <Select defaultValue="new">
        <SelectTrigger variant="secondary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        <Button variant="outline" size="sm" aria-label="Sort">
          <ArrowDownUp />
        </Button>
        <Searchbox
          placeholder="Search"
          onChange={() => {
            // @todo: will be implemented later
          }}
        />
      </ActionGroup>
    </Flex>
  );
};

export default OrderTableAction;

const styles = {
  wrapper: scoped({
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  }),
  selectTrigger: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  }),
};
