import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import HBarList from '@/features/analytics/components/charts/hbar-list';
import { useMoney } from '@/features/analytics/contexts/amount-format-context';
import { formatNumber } from '@/features/analytics/lib/format';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import { __, _n, sprintf } from '@/wpi18n';

const formatOrders = (orders: number) => {
  return sprintf(
    /* translators: %s: number of orders */
    _n('%s order', '%s orders', orders, 'kirki-ecommerce'),
    formatNumber(orders),
  );
};

const SalesByCouponCodeCard = (props: CardProps<'sales_by_coupon_code'>) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().sales_by_coupon_code;

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-sales_by_coupon_code"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <HBarList
          items={data.items.map((item) => ({
            key: item.code,
            label: item.code,
            value: item.orders,
            display: formatNumber(item.orders),
            detail: sprintf(
              /* translators: %s: discount amount given by the coupon code */
              __('%s off', 'kirki-ecommerce'),
              money(item.discount_given_money_object).text,
            ),
            change: item.change,
          }))}
        />
      )}
    </AnalyticsCard>
  );
};

SalesByCouponCodeCard.displayName = 'SalesByCouponCodeCard';

const SalesByPaymentMethodCard = (props: CardProps<'sales_by_payment_method'>) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().sales_by_payment_method;

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-sales_by_payment_method"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <HBarList
          items={data.items.map((item) => ({
            key: item.id,
            label: item.name,
            value: Number(item.total_sales_money_object.raw),
            display: money(item.total_sales_money_object).text,
            displayTitle: money(item.total_sales_money_object).title,
            detail: formatOrders(item.orders),
            change: item.change,
          }))}
        />
      )}
    </AnalyticsCard>
  );
};

SalesByPaymentMethodCard.displayName = 'SalesByPaymentMethodCard';

const TaxesByRegionCard = (props: CardProps<'taxes_by_region'>) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().taxes_by_region;

  return (
    <AnalyticsCard title={definition.title} info={definition.info} testId="card-taxes_by_region">
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <HBarList
          items={data.items.map((item) => ({
            key: `${item.country ?? ''}-${item.state ?? ''}`,
            label: item.name,
            value: Number(item.total_tax_money_object.raw),
            display: money(item.total_tax_money_object).text,
            displayTitle: money(item.total_tax_money_object).title,
            note: sprintf(
              /* translators: 1: product tax amount, 2: shipping tax amount */
              __('Product %1$s · Shipping %2$s', 'kirki-ecommerce'),
              money(item.product_tax_money_object).text,
              money(item.shipping_tax_money_object).text,
            ),
            change: item.change,
          }))}
        />
      )}
    </AnalyticsCard>
  );
};

TaxesByRegionCard.displayName = 'TaxesByRegionCard';

const ShippingChargesByMethodCard = (props: CardProps<'shipping_charges_by_method'>) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().shipping_charges_by_method;

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-shipping_charges_by_method"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <HBarList
          items={data.items.map((item) => ({
            key: item.id,
            label: item.name,
            value: Number(item.shipping_charges_money_object.raw),
            display: money(item.shipping_charges_money_object).text,
            displayTitle: money(item.shipping_charges_money_object).title,
            detail: formatOrders(item.orders),
            change: item.change,
          }))}
        />
      )}
    </AnalyticsCard>
  );
};

ShippingChargesByMethodCard.displayName = 'ShippingChargesByMethodCard';

export {
  SalesByCouponCodeCard,
  SalesByPaymentMethodCard,
  ShippingChargesByMethodCard,
  TaxesByRegionCard,
};
