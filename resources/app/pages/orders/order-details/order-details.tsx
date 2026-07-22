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
import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
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
            <Button variant="ghost" size="sm" aria-label="More options">
              <ShowMoreIcon />
            </Button>
            <Button variant="ghost" size="sm">
              Cancel Order
            </Button>
            <Button variant="primary" size="sm">
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
        <Flex gap={16}>
          <Flex direction="column" gap={16} style={{ width: '70%' }}>
            <Card type="form">
              <Text header="Items(4)" type="primary" padding="large" />
              <Card type="inner" style={{ padding: '0' }}>
                <ItemsTable />
              </Card>
            </Card>

            <Card type="form">
              <Payment />
            </Card>

            <Card type="form">
              <Text header="Timeline" type="primary" padding="large" />
              This is timeline section
            </Card>
          </Flex>

          <Flex direction="column" gap={16} style={{ width: '30%' }}>
            <Alert
              hasHighlight
              icon={<FlagIcon />}
              text="Manually created by the Admin."
            />

            <Card type="form">
              <Flex direction="column" gap={8}>
                <Label text="Order Status" />
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
              </Flex>
              <Flex direction="column" gap={8}>
                <Label text="Payment Status" />
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
              </Flex>
            </Card>

            <CustomerInfo />

            <Card type="form">
              <Flex direction="column" gap={8}>
                <Label text="Flag" />
                <Input placeholder="i.e Backorder, Urgent" defaultValue="skjl" />
              </Flex>
            </Card>

            <Card type="form">
              <Label text="Notes" />
              <Button variant="secondary" style={{ width: '100%' }}>
                <PlusIcon />
                Add note
              </Button>
            </Card>
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

export default OrderDetails;
