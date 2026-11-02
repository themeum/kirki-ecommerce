import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import SegmentedBar from '@/features/analytics/components/charts/segmented-bar';
import { formatNumber } from '@/features/analytics/lib/format';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const colors = theme.colors.analytics.fulfillment;

const STATUS_COLORS: Record<string, string> = {
  unfulfilled: colors.unfulfilled,
  processing: colors.processing,
  'on-hold': colors.onHold,
  shipped: colors.shipped,
  delivered: colors.delivered,
  returned: colors.returned,
  cancelled: colors.cancelled,
};

const getStatusLabels = (): Record<string, string> => ({
  unfulfilled: __('Unfulfilled', 'kirki-ecommerce'),
  processing: __('Processing', 'kirki-ecommerce'),
  'on-hold': __('On hold', 'kirki-ecommerce'),
  shipped: __('Shipped', 'kirki-ecommerce'),
  delivered: __('Delivered', 'kirki-ecommerce'),
  returned: __('Returned', 'kirki-ecommerce'),
  cancelled: __('Cancelled', 'kirki-ecommerce'),
});

const formatShare = (value: number) => `${Number(value.toFixed(1))}%`;

const FulfillmentStatusCard = (props: CardProps<'orders_by_fulfillment_status'>) => {
  const { data, isEmpty } = props;
  const definition = getMetricDefinitions().orders_by_fulfillment_status;
  const labels = getStatusLabels();

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-orders_by_fulfillment_status"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <>
          <Flex align="baseline" gap={2} wrap="wrap">
            <Text variant="heading4" weight="bold">
              {formatShare(data.delivered_percent)}
            </Text>
            <Text color="subdued">
              {sprintf(
                /* translators: %s: number of orders */
                __('delivered · %s orders', 'kirki-ecommerce'),
                formatNumber(data.total_orders),
              )}
            </Text>
          </Flex>
          <SegmentedBar
            label={definition.title}
            segments={data.items.map((item) => ({
              key: item.status,
              label: labels[item.status] ?? item.status,
              value: item.count,
              color: STATUS_COLORS[item.status] ?? colors.unfulfilled,
            }))}
          />
          <ul css={scoped(styles.list)}>
            {data.items.map((item) => (
              <li key={item.status} css={scoped(styles.row)}>
                <span css={scoped(styles.label)}>
                  <span
                    css={scoped(styles.dot)}
                    style={{ backgroundColor: STATUS_COLORS[item.status] ?? colors.unfulfilled }}
                    aria-hidden="true"
                  />
                  <Text color="secondary">{labels[item.status] ?? item.status}</Text>
                </span>
                <Text weight="bold">{formatNumber(item.count)}</Text>
                <Text color="subdued" cssOverride={styles.percent}>
                  {formatShare(item.percent)}
                </Text>
              </li>
            ))}
          </ul>
        </>
      )}
    </AnalyticsCard>
  );
};

FulfillmentStatusCard.displayName = 'FulfillmentStatusCard';

export default FulfillmentStatusCard;

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
    gap: theme.spacing[6],
    margin: 0,
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    flex: 1,
    minWidth: 0,
  },
  percent: {
    minWidth: '40px',
    textAlign: 'right',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: theme.radius.full,
    flexShrink: 0,
  },
});
