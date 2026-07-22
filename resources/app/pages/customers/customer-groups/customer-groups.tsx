import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import type { SelectOption } from '@/types';

import CustomerGroupTable from '@/pages/customers/customer-groups/customer-group-table';

const CustomerGroups = () => {
  const selectOptions: SelectOption[] = [
    { value: 'all', title: 'All Groups' },
    { value: 'new', title: 'New Groups' },
    { value: 'top', title: 'Top Groups' },
  ];
  return (
    <>
      <PageHeading
        text="Manage Groups"
        type="primary"
        actions={
          <Button variant="primary" size="sm">
            Create Group
          </Button>
        }
        style={{ columnGap: '12px' }}
        hasBack
        sticky
      />

      <Container>
        <Card type="table">
          <Flex style={{ padding: '16px 12px' }}>
            <Select defaultValue="all">
              <SelectTrigger
                className={`${CLASS_PREFIX}-ui-select-trigger--secondary`}
              >
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
              <Input placeholder="Search" />
            </ActionGroup>
          </Flex>
          <CustomerGroupTable />
        </Card>
      </Container>
    </>
  );
};

export default CustomerGroups;
