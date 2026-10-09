import { type ReactNode, useMemo } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import DiscountPopover from '@/features/orders/components/order-create/payment/discount-popover';
import ShippingPopover from '@/features/orders/components/order-create/payment/shipping-popover';
import type { OrderCalculation } from '@/features/orders/schemas/catalog/order';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __, _n, sprintf } from '@/wpi18n';

const EMPTY_AMOUNT = '—';

type PaymentSummaryTotals = Pick<
  OrderCalculation['totals'],
  | 'base_items_subtotal_exclusive_money_object'
  | 'base_items_subtotal_inclusive_money_object'
  | 'base_order_total_exclusive_money_object'
  | 'base_order_total_inclusive_money_object'
  | 'base_shipping_amount_money_object'
  | 'base_total_money_object'
>;

type PaymentSummaryCoupon = Pick<
  OrderCalculation['coupons'][number],
  | 'code'
  | 'title'
  | 'discount_value_type'
  | 'discount_amount_percentage'
  | 'base_discount_amount_money_object'
>;

type PaymentSummaryTaxLine = Pick<
  OrderCalculation['tax_lines'][number],
  'name' | 'rate' | 'base_amount_money_object'
>;

type PaymentSummaryCardProps = {
  totals?: PaymentSummaryTotals;
  coupons?: PaymentSummaryCoupon[];
  taxLines?: PaymentSummaryTaxLine[];
  itemsCount?: number;
  availableShippingMethods?: OrderCalculation['available_shipping_methods'];
  shippingMethodName?: string | null;
  isCalculating?: boolean;
  isDiscountEditable?: boolean;
  isShippingEditable?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
};

const getCouponLabel = (coupon: PaymentSummaryCoupon) => {
  if (coupon.discount_value_type === 'percentage' && isDefined(coupon.discount_amount_percentage)) {
    return sprintf(
      /* translators: %1$s: coupon code, %2$s: discount percentage */
      __('%1$s (%2$s%% off)', 'kirki-ecommerce'),
      coupon.code,
      coupon.discount_amount_percentage,
    );
  }

  return coupon.title ?? coupon.code;
};

const PaymentSummaryCard = ({
  totals,
  coupons = [],
  taxLines = [],
  itemsCount,
  availableShippingMethods = [],
  shippingMethodName,
  isCalculating,
  isDiscountEditable,
  isShippingEditable,
  badge,
  actions,
}: PaymentSummaryCardProps) => {
  const subtotalDisplay = totals
    ? totals.base_items_subtotal_exclusive_money_object.display
    : EMPTY_AMOUNT;
  const totalDisplay = totals
    ? totals.base_order_total_exclusive_money_object.display
    : EMPTY_AMOUNT;
  const shippingDisplay = totals?.base_shipping_amount_money_object.display ?? EMPTY_AMOUNT;
  const orderTotalDisplay = totals?.base_total_money_object.display ?? EMPTY_AMOUNT;

  const isProductSelected = useMemo(() => {
    return isDefined(itemsCount) && itemsCount > 0;
  }, [itemsCount]);

  return (
    <Card cssOverride={{ gap: theme.spacing[3] }}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle>
          <Text variant="heading6">{__('Payment', 'kirki-ecommerce')}</Text>
        </CardTitle>
        <Flex gap={2} align="center">
          {isCalculating && <Spinner />}
          {badge}
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2} cssOverride={styles.dashedCard}>
          <Flex justify="space-between">
            <Text variant="small" color="secondary" cssOverride={styles.info}>
              {__('Subtotal (Excl. tax)', 'kirki-ecommerce')}
            </Text>
            {isProductSelected ? (
              <Flex justify="space-between" grow={1}>
                <Text variant="small" color="secondary">
                  {sprintf(
                    /* translators: %s: number of items */
                    _n('%s item', '%s items', itemsCount ?? 0, 'kirki-ecommerce'),
                    itemsCount ?? 0,
                  )}
                </Text>
                <Text>{subtotalDisplay}</Text>
              </Flex>
            ) : (
              <Text>{subtotalDisplay}</Text>
            )}
          </Flex>

          {isProductSelected && coupons.length === 0 ? (
            <Flex justify="space-between">
              {isDiscountEditable ? (
                <DiscountPopover>
                  <Button variant="link" cssOverride={styles.buttonLink}>
                    <Flex gap={1} align="center" cssOverride={styles.info}>
                      <Text variant="tiny" color="emphasis" weight="medium">
                        {__('Edit Discount', 'kirki-ecommerce')}
                      </Text>
                    </Flex>
                  </Button>
                </DiscountPopover>
              ) : (
                <>
                  <Text variant="tiny" cssOverride={styles.info}>
                    {__('Discount', 'kirki-ecommerce')}
                  </Text>
                  <Text variant="small">{EMPTY_AMOUNT}</Text>
                </>
              )}
            </Flex>
          ) : (
            coupons.map((coupon, index) => (
              <Flex key={coupon.code ?? index} justify="space-between">
                {index === 0 ? (
                  isProductSelected && isDiscountEditable ? (
                    <DiscountPopover>
                      <Button variant="link" cssOverride={styles.buttonLink}>
                        <Flex gap={1} align="center" cssOverride={styles.info}>
                          <Text variant="tiny" color="emphasis" weight="medium">
                            {__('Edit Discount', 'kirki-ecommerce')}
                          </Text>
                        </Flex>
                      </Button>
                    </DiscountPopover>
                  ) : (
                    <Text variant="tiny" cssOverride={styles.info}>
                      {__('Discount', 'kirki-ecommerce')}
                    </Text>
                  )
                ) : (
                  <Text cssOverride={styles.info} />
                )}
                <Flex justify="space-between" grow={1}>
                  <Text variant="small" color="secondary">
                    {getCouponLabel(coupon)}
                  </Text>
                  <Text variant="small">
                    {sprintf('-%s', coupon.base_discount_amount_money_object.display)}
                  </Text>
                </Flex>
              </Flex>
            ))
          )}

          <Separator color={theme.colors.border.secondary} />

          <Flex justify="space-between">
            <Text variant="small" weight="semibold">
              {__('Total', 'kirki-ecommerce')}
            </Text>
            <Text variant="small" weight="semibold">
              {totalDisplay}
            </Text>
          </Flex>

          <Flex justify="space-between">
            {isProductSelected && isShippingEditable ? (
              <ShippingPopover
                availableShippingMethods={availableShippingMethods}
                isLoading={isCalculating}
              >
                <Button variant="link" cssOverride={styles.buttonLink}>
                  <Flex gap={1} align="center" cssOverride={styles.info}>
                    <Text variant="tiny" color="emphasis" weight="medium">
                      {__('Edit Shipping', 'kirki-ecommerce')}
                    </Text>
                  </Flex>
                </Button>
              </ShippingPopover>
            ) : (
              <Text variant="tiny" weight="medium" cssOverride={styles.info}>
                {__('Shipping', 'kirki-ecommerce')}
              </Text>
            )}
            <Flex justify="space-between" grow={1}>
              <Text variant="small" color="secondary">
                {shippingMethodName}
              </Text>
              <Text variant="small">{shippingDisplay}</Text>
            </Flex>
          </Flex>

          {taxLines.map((taxLine, index) => (
            <Flex key={`${taxLine.name}-${taxLine.rate}`} justify="space-between">
              <Text variant="tiny" color="secondary" cssOverride={styles.info}>
                {index === 0 ? __('Estimated Tax', 'kirki-ecommerce') : ''}
              </Text>
              <Flex justify="space-between" grow={1}>
                <Text variant="small" color="secondary">
                  {sprintf('%s %s%%', taxLine.name, taxLine.rate)}
                </Text>
                <Text variant="small">{taxLine.base_amount_money_object.display}</Text>
              </Flex>
            </Flex>
          ))}

          {taxLines.length === 0 && (
            <Flex justify="space-between">
              <Text variant="tiny" color="secondary" cssOverride={styles.info}>
                {__('Estimated tax', 'kirki-ecommerce')}
              </Text>
              <Text variant="small">{EMPTY_AMOUNT}</Text>
            </Flex>
          )}

          <Separator color={theme.colors.border.secondary} />

          <Flex justify="space-between">
            <Text variant="small" weight="semibold">
              {__('Order total', 'kirki-ecommerce')}
            </Text>
            <Text variant="small" weight="semibold">
              {orderTotalDisplay}
            </Text>
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
    borderRadius: theme.radius.lg,
  },
  buttonLink: {
    color: theme.colors.text.emphasis,
    ...theme.typography.tiny('medium'),
    gap: theme.spacing[1],
  },
  info: {
    width: '10rem',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
