import Button from '@/components/ui/button';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import CustomerGroupTable from '@/features/customers/pages/customer-groups/customer-group-table';
import { theme } from '@/theme';

const CustomerGroups = () => (
  <Page>
    <PageHeading
      text="Manage Groups"
      actions={<Button variant="primary">Create Group</Button>}
      style={{ columnGap: theme.spacing[3] }}
      hasBack
    />

    <PageContent>
      <CustomerGroupTable />
    </PageContent>
  </Page>
);

export default CustomerGroups;
