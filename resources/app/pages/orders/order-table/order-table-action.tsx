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
import type { SelectOption } from '@/types';

const OrderTableAction = () => {
  const selectOptions: SelectOption[] = [
    { value: 'all', title: 'All Orders' },
    { value: 'new', title: 'New Orders' },
    { value: 'top', title: 'Top Orders' },
  ];

  return (
    <Flex style={{ padding: '16px 12px' }}>
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
          <SelectTrigger style={{ padding: '8px 16px' }}>
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
        <Searchbox placeholder="Search" />
      </ActionGroup>
    </Flex>
  );
};

export default OrderTableAction;
