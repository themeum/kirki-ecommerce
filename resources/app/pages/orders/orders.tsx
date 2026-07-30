import type { CSSObject } from '@emotion/react';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';

import OrderTable from '@/pages/orders/order-table/order-table';
import OrderTableAction from '@/pages/orders/order-table/order-table-action';
import TableInfo from '@/pages/orders/order-table/table-info';

const Orders = () => {
  return (
    <>
      <PageHeading
        text="Orders"
        actions={
          <>
            <Button variant="ghost">
              Import
            </Button>
            <Button variant="ghost">
              Export
            </Button>
            <Button variant="primary">
              Add Order
            </Button>
          </>
        }
      />
      <Container>
        <Card cssOverride={mergeCss(cardStyles.formCard, styles.tableInfoCard)}>
          <CardContent>
            <TableInfo />
          </CardContent>
        </Card>
        <Card cssOverride={cardStyles.tableCard}>
          <CardContent cssOverride={cardStyles.tableContent}>
            <OrderTableAction />
            <OrderTable />
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default Orders;

const styles = {
  tableInfoCard: ({
    marginBottom: theme.spacing[2],
  } satisfies CSSObject),
};
