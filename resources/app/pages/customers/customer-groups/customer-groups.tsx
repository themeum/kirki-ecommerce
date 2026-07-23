import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent } from '@/components/ui/card';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
        <Card css={styles.tableCard}>
          <CardContent css={styles.tableContent}>
            <Flex style={{ padding: '16px 12px' }}>
              <Select defaultValue="all">
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
                <Input placeholder="Search" />
              </ActionGroup>
            </Flex>
            <CustomerGroupTable />
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default CustomerGroups;

const styles = {
  tableCard: scoped({
    overflow: 'hidden',
    border: '1px solid #e6e6e6',
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
};
