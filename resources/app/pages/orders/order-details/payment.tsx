import Button from '@/components/ui/button';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';

const Payment = () => {
  return (
    <Flex direction="column" gap={16}>
      <Flex style={{ justifyContent: 'space-between' }}>
        <Text header="Payment" type="primary" />
        <Badge type="pending" text="UNPAID" />
      </Flex>
      <Card css={[cardStyles.innerCard, styles.dashedCard]}>
        <CardContent css={cardStyles.innerContent}>
          <Flex direction="column" gap={4}>
          <Flex style={{ justifyContent: 'space-between' }}>
            <span>Items</span>
            <span>$900</span>
          </Flex>
          <Flex style={{ justifyContent: 'space-between' }}>
            <span>Shipping </span>
            <span>$100</span>
          </Flex>
          <Flex style={{ justifyContent: 'space-between' }}>
            <span>Tax</span>
            <span>$10</span>
          </Flex>
          <Flex style={{ justifyContent: 'space-between' }}>
            <span>Total</span>
            <span>$1200</span>
          </Flex>
          </Flex>
        </CardContent>
      </Card>
      <ActionGroup>
        <Button variant="outline">Send invoice</Button>
        <Button variant="secondary">Mark as read</Button>
      </ActionGroup>
    </Flex>
  );
};

export default Payment;

const styles = {
  dashedCard: scoped({
    borderStyle: 'dashed',
  }),
};
