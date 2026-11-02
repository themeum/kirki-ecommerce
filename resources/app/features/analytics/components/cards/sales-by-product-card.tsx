import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import ChangeBadge from '@/features/analytics/components/change-badge';
import { useMoney } from '@/features/analytics/contexts/amount-format-context';
import { formatNumber } from '@/features/analytics/lib/format';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import type { AnalyticsCards } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type ProductItem = AnalyticsCards['sales_by_product']['items'][number];

const PRODUCT_IMAGE_SIZE = '40px';

const getStockBadge = (product: ProductItem) => {
  if (!product.availability_status) {
    return null;
  }

  if (product.availability_status === 'out_of_stock') {
    return { variant: 'destructive', text: __('Out of stock', 'kirki-ecommerce') } as const;
  }

  if (product.track_inventory && (product.inventory ?? 0) > 0) {
    return {
      variant: product.availability_status === 'low_stock' ? 'warning' : 'default',
      /* translators: %s: number of units left in stock */
      text: sprintf(__('%s left in stock', 'kirki-ecommerce'), formatNumber(product.inventory)),
    } as const;
  }

  return { variant: 'success', text: __('In stock', 'kirki-ecommerce') } as const;
};

const SalesByProductCard = (props: CardProps<'sales_by_product'>) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().sales_by_product;

  return (
    <AnalyticsCard title={definition.title} info={definition.info} testId="card-sales_by_product">
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <ul css={scoped(styles.list)}>
          {data.items.map((item) => {
            const stockBadge = getStockBadge(item);

            return (
              <li key={item.product_id ?? item.name} css={scoped(styles.row)}>
                <Image
                  src={item.image}
                  alt=""
                  width={PRODUCT_IMAGE_SIZE}
                  height={PRODUCT_IMAGE_SIZE}
                  fit="cover"
                />
                <Flex direction="column" cssOverride={styles.details}>
                  <Flex align="center" gap={2} cssOverride={styles.title}>
                    <Text variant="small" weight="medium" truncate>
                      {item.name}
                    </Text>
                    {stockBadge && <Badge variant={stockBadge.variant}>{stockBadge.text}</Badge>}
                  </Flex>
                  <Text variant="tiny" color="subdued">
                    {sprintf(
                      /* translators: %s: number of units sold */
                      _n('%s unit sold', '%s units sold', item.units_sold, 'kirki-ecommerce'),
                      formatNumber(item.units_sold),
                    )}
                  </Text>
                </Flex>
                <Flex direction="column" align="end" cssOverride={styles.sales}>
                  <Text
                    variant="small"
                    weight="semibold"
                    title={money(item.net_sales_money_object).title}
                  >
                    {money(item.net_sales_money_object).text}
                  </Text>
                  <ChangeBadge change={item.change} />
                </Flex>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsCard>
  );
};

SalesByProductCard.displayName = 'SalesByProductCard';

export default SalesByProductCard;

const styles = defineStyles({
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    margin: 0,
    minWidth: 0,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing[1],
  },
  title: {
    minWidth: 0,
  },
  sales: {
    flexShrink: 0,
    gap: theme.spacing[1],
  },
});
