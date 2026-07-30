import type { CSSObject } from '@emotion/react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent } from '@/components/ui/card';
import { cardStyles } from '@/theme/card-styles';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { theme } from '@/theme';
;
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
          <Button variant="primary">
            Create Group
          </Button>
        }
        style={{ columnGap: theme.spacing[3] }}
        hasBack
        sticky
      />

      <Container>
        <Card cssOverride={cardStyles.tableCard}>
          <CardContent cssOverride={cardStyles.tableContent}>
            <Flex cssOverride={styles.wrapper}>
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
                  <SelectTrigger cssOverride={styles.selectTrigger}>
                    <SelectValue placeholder="Date: This Month" />
                  </SelectTrigger>
                  <SelectContent />
                </Select>
                <Button variant="outline">
                  <ListFilter />
                  Filter
                </Button>
                <Button variant="outline" aria-label="Sort">
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
  wrapper: ({
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  } satisfies CSSObject),
  selectTrigger: ({
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  } satisfies CSSObject),
};

