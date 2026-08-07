import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import { PlusCircleIcon } from '@/icons';
import DiscountPopover from '@/pages/orders/order-create/components/payment/discount-popover';
import ShippingPopover from '@/pages/orders/order-create/components/payment/shipping-popover';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { OrderCalculation, OrderFormInput } from '@/types';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

const EMPTY_AMOUNT = '—';

type PaymentSummaryAmounts = {
  itemsCount?: number;
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
  total?: string;
};

type PaymentSummaryCardProps = {
  amounts?: PaymentSummaryAmounts;
  availableShippingMethods?: OrderCalculation['available_shipping_methods'];
  isCalculating?: boolean;
  isDiscountEditable?: boolean;
  isShippingEditable?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
};

const PaymentSummaryCard = ({
  amounts,
  availableShippingMethods = [],
  isCalculating,
  isDiscountEditable,
  isShippingEditable,
  badge,
  actions,
}: PaymentSummaryCardProps) => {
  const { control } = useFormContext<OrderFormInput>();
  const couponCode = useWatch({ control, name: 'coupon_code' });
  const shippingMethodId = useWatch({ control, name: 'shipping_method' });

  const shippingMethodName = availableShippingMethods.find(
    (method) => String(method.id) === shippingMethodId,
  )?.name;

  const itemsCount = amounts?.itemsCount;
  const subtotalDisplay = amounts?.subtotal ?? EMPTY_AMOUNT;
  const discountDisplay = amounts?.discount ?? EMPTY_AMOUNT;
  const shippingDisplay = amounts?.shipping ?? EMPTY_AMOUNT;
  const taxDisplay = amounts?.tax ?? EMPTY_AMOUNT;
  const totalDisplay = amounts?.total ?? EMPTY_AMOUNT;

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle><Text variant='heading6'>{__('Payment', 'kirki-ecommerce')}</Text></CardTitle>
        <Flex gap={2} align='center'>
          {isCalculating && <Spinner />}
          {badge}
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2} cssOverride={styles.dashedCard}>
          <Flex justify="space-between">
            <Text variant='small' color="secondary" cssOverride={styles.info}>
              {__('Subtotal', 'kirki-ecommerce')}
            </Text>
            {isDefined(itemsCount) && itemsCount > 0 ? (
              <Flex justify="space-between" grow={1}>
                {/* translators: %s: number of items */}
                <Text variant='small' color="secondary">{sprintf(__('%s items', 'kirki-ecommerce'), itemsCount)}</Text>
                <Text>{subtotalDisplay}</Text>
              </Flex>
            ) : (
              <Text>{subtotalDisplay}</Text>
            )}
          </Flex>
          <Flex justify="space-between">
            {isDiscountEditable ? (
              <DiscountPopover>
                <Button variant="link" cssOverride={styles.buttonLink}>
                  <Flex gap={1} align='center' cssOverride={styles.info}>
                    <PlusCircleIcon color={theme.colors.text.emphasis} />
                    <Text variant='tiny' color='emphasis'>{__('Discount', 'kirki-ecommerce')}</Text>
                  </Flex>
                </Button>
              </DiscountPopover>
            ) : (
              <Text variant='tiny' color="emphasis" cssOverride={styles.info}>
                {__('Discount', 'kirki-ecommerce')}
              </Text>
            )}
            <Flex justify="space-between" grow={1}>
              <Text variant='small' color="secondary">{couponCode}</Text>
              <Text variant='small'>{discountDisplay}</Text>
            </Flex>
          </Flex>
          <Flex justify="space-between">
            {isShippingEditable ? (
              <ShippingPopover
                availableShippingMethods={availableShippingMethods}
                isLoading={isCalculating}
              >
                <Button variant="link" cssOverride={styles.buttonLink}>
                  <Flex gap={1} align='center' cssOverride={styles.info}>
                    <PlusCircleIcon color={theme.colors.text.emphasis} />
                    <Text variant='tiny' color='emphasis'>{__('Shipping', 'kirki-ecommerce')}</Text>
                  </Flex>
                </Button>
              </ShippingPopover>
            ) : (
              <Text variant='tiny' color="emphasis" cssOverride={styles.info}>
                {__('Shipping', 'kirki-ecommerce')}
              </Text>
            )}
            <Flex justify="space-between" grow={1}>
              <Text variant='small' color="secondary">{shippingMethodName}</Text>
              <Text variant='small'>{shippingDisplay}</Text>
            </Flex>
          </Flex>
          <Flex justify="space-between">
            <Text variant='tiny' color="emphasis" cssOverride={styles.info}>
              {__('Estimated tax', 'kirki-ecommerce')}
            </Text>
            <Text variant='small'>{taxDisplay}</Text>
          </Flex>
          <Separator />
          <Flex justify="space-between">
            <Text variant='small' weight="semibold">{__('Total', 'kirki-ecommerce')}</Text>
            <Text variant='small' weight="semibold">{totalDisplay}</Text>
          </Flex>
        </Flex>
      </CardContent>
      {Boolean(actions) && <CardFooter>{actions}</CardFooter>}
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
});
