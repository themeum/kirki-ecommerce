import { css } from '@emotion/react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlagIcon, PlusIcon, ShowMoreIcon } from '@/icons';
import Alert from '@/components/ui/alert';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import type { SelectOption } from '@/types';

import CustomerInfo from '@/pages/orders/order-details/customer-info';
import ItemsTable from '@/pages/orders/order-details/items-table';
import Payment from '@/pages/orders/order-details/payment';

const OrderDetails = () => {
  const optionsArray: SelectOption[] = [
    { value: 'paid', title: 'Paid' },
    { value: 'unpaid', title: 'Unpaid' },
    { value: 'pending', title: 'Pending' },
  ];

  return (
    <>
      <PageHeading
        text="Order #21132"
        type="primary"
        actions={
          <>
            <Button variant="ghost" aria-label="More options">
              <ShowMoreIcon />
            </Button>
            <Button variant="ghost">
              Cancel Order
            </Button>
            <Button variant="primary">
              Update
            </Button>
          </>
        }
        hasBack
        sticky
      >
        <Badge text="Pending" type="pending" />
      </PageHeading>
      <Container>
        <Flex gap={4}>
          <Flex direction="column" gap={4} css={css({ width: '70%' })}>
            <Card css={cardStyles.formCard}>
              <CardHeader>
                <CardTitle>Items(4)</CardTitle>
              </CardHeader>
              <CardContent>
                <Card css={cardStyles.innerCard}>
                  <CardContent css={styles.zeroPadding}>
                    <ItemsTable />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card css={cardStyles.formCard}>
              <CardContent>
                <Payment />
              </CardContent>
            </Card>

            <Card css={cardStyles.formCard}>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>This is timeline section</CardContent>
            </Card>
          </Flex>

          <Flex direction="column" gap={4} css={css({ width: '30%' })}>
            <Alert
              hasHighlight
              icon={<FlagIcon />}
              text="Manually created by the Admin."
            />

            <Card css={cardStyles.formCard}>
              <CardContent>
                <Field>
                  <FieldLabel>Order Status</FieldLabel>
                  <Select defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsArray.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Payment Status</FieldLabel>
                  <Select defaultValue="unpaid">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {optionsArray.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>

            <CustomerInfo />

            <Card css={cardStyles.formCard}>
              <CardContent>
                <Field>
                  <FieldLabel>Flag</FieldLabel>
                  <Input placeholder="i.e Backorder, Urgent" defaultValue="skjl" />
                </Field>
              </CardContent>
            </Card>

            <Card css={cardStyles.formCard}>
              <CardContent>
                <Field>
                  <FieldLabel>Notes</FieldLabel>
                  <Button variant="secondary" style={{ width: '100%' }}>
                    <PlusIcon />
                    Add note
                  </Button>
                </Field>
              </CardContent>
            </Card>
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

export default OrderDetails;

const styles = {
  zeroPadding: scoped({
    padding: theme.spacing[0],
  })
};
