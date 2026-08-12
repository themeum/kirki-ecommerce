import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import PageHeading from '@/components/ui/page-heading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp, ListFilter } from '@/icons';
import CustomerGroupTable from '@/pages/customers/customer-groups/customer-group-table';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

const CustomerGroups = () => {
  const selectOptions: SelectOption[] = [
    { value: 'all', title: __('All Groups', 'kirki-ecommerce') },
    { value: 'new', title: __('New Groups', 'kirki-ecommerce') },
    { value: 'top', title: __('Top Groups', 'kirki-ecommerce') },
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

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});

