import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import CustomerGroupTable from '@/features/customers/pages/customer-groups/customer-group-table';
import { theme } from '@/theme';

const CustomerGroups = () => (
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
      <CustomerGroupTable />
    </Container>
  </>
);

export default CustomerGroups;

