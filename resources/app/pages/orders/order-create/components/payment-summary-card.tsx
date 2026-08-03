import { useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { PlusCircleIcon } from '@/icons';
import DiscountPopover from '@/pages/orders/order-create/components/payment/discount-popover';
import ShippingPopover from '@/pages/orders/order-create/components/payment/shipping-popover';
import {
  computeOrderTotals,
  formatCurrency,
} from '@/pages/orders/order-create/config/order-totals';
import type { OrderLineRow } from '@/pages/orders/order-create/types';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { OrderFormInput } from '@/types';
import { __, sprintf } from '@/wpi18n';

type PaymentSummaryCardProps = {
  rows: OrderLineRow[];
};

const PaymentSummaryCard = ({ rows }: PaymentSummaryCardProps) => {
  const totals = computeOrderTotals(rows);
  const { control } = useFormContext<OrderFormInput>();
  const couponCode = useWatch({ control, name: 'coupon_code' });
  const shippingMethod = useWatch({ control, name: 'shipping_method' });

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle><Text variant='heading6'>{__('Payment', 'kirki-ecommerce')}</Text></CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2} cssOverride={styles.dashedCard}>
          <Flex justify="space-between">
            <Text variant='small' color="secondary" cssOverride={styles.info}>
              {__('Subtotal', 'kirki-ecommerce')}
            </Text>
            <Flex justify="space-between" grow={1}>
              {/* translators: %s: number of items */}
              <Text variant='small' color="secondary">{sprintf(__('%s items', 'kirki-ecommerce'), totals.itemCount)}</Text>
              <Text>{formatCurrency(totals.subtotal)}</Text>
            </Flex>
          </Flex>
          <Flex justify="space-between">
            <DiscountPopover>
              <Button variant="link" cssOverride={styles.buttonLink}>
                <Flex gap={1} align='center' cssOverride={styles.info}>
                  <PlusCircleIcon color={theme.colors.text.emphasis} />
                  <Text variant='tiny' color='emphasis'>{__('Discount', 'kirki-ecommerce')}</Text>
                </Flex>
              </Button>
            </DiscountPopover>
            <Flex justify="space-between" grow={1}>
              <Text variant='small' color="secondary">{couponCode}</Text>
              <Text variant='small'>{formatCurrency(totals.discount)}</Text>
            </Flex>
          </Flex>
          <Flex justify="space-between">
            <ShippingPopover>
              <Button variant="link" cssOverride={styles.buttonLink}>
                <Flex gap={1} align='center' cssOverride={styles.info}>
                  <PlusCircleIcon color={theme.colors.text.emphasis} />
                  <Text variant='tiny' color='emphasis'>{__('Shipping', 'kirki-ecommerce')}</Text>
                </Flex>
              </Button>
            </ShippingPopover>
            <Flex justify="space-between" grow={1}>
              <Text variant='small' color="secondary">{shippingMethod}</Text>
              <Text variant='small'>{formatCurrency(totals.shipping)}</Text>
            </Flex>
          </Flex>
          <Flex justify="space-between">
            <Text variant='tiny' color="emphasis" cssOverride={styles.info}>
              {__('Estimated tax', 'kirki-ecommerce')}
            </Text>
            <Flex justify="space-between" grow={1}>
              {/* TODO: add tax rate */}
              {/* translators: %s: tax rate */}
              <Text variant='small'>{sprintf(__('VAT %s', 'kirki-ecommerce'), '15%')}</Text>
              <Text variant='small'>{formatCurrency(totals.tax)}</Text>
            </Flex>
          </Flex>
          <Separator />
          <Flex justify="space-between">
            <Text variant='small' weight="semibold">{__('Total', 'kirki-ecommerce')}</Text>
            <Text variant='small' weight="semibold">{formatCurrency(totals.total)}</Text>
          </Flex>
        </Flex>
      </CardContent>
    </Card>
  );
};

PaymentSummaryCard.displayName = 'PaymentSummaryCard';

export default PaymentSummaryCard;

const styles = defineStyles({
  dashedCard: {
    padding: theme.spacing[3],
    border: `1px dashed ${theme.colors.border.alt}`,
    borderRadius: theme.radius.md
  },
  buttonLink: {
    color: theme.colors.text.emphasis,
    ...theme.typography.tiny('medium'),
    gap: theme.spacing[1]
  },
  info: {
    width: '10rem'
  }
});
