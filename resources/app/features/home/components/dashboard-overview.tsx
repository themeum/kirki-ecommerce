import Flex from '@/components/ui/flex';
import QueryErrorState from '@/components/ui/query-error-state';
import MetricCard from '@/features/home/components/metric-card';
import RecentOrdersCard from '@/features/home/components/recent-orders-card';
import TopProductsCard from '@/features/home/components/top-products-card';
import type { DashboardMetrics } from '@/features/home/schemas/catalog/dashboard-overview';
import { useDashboardOverviewQuery } from '@/features/home/services/dashboard';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const getMetricCards = (metrics?: DashboardMetrics) => [
  {
    label: __('Total sales', 'kirki-ecommerce'),
    info: __(
      'All money customers paid for their orders, including tax and shipping, in your store currency. Refunds are not removed.',
      'kirki-ecommerce',
    ),
    value: metrics?.base_total_sales_money_object.display,
  },
  {
    label: __('Net sales', 'kirki-ecommerce'),
    info: __('Total sales minus tax, shipping and completed refunds.', 'kirki-ecommerce'),
    value: metrics?.base_net_sales_money_object.display,
  },
  {
    label: __('Orders', 'kirki-ecommerce'),
    info: __(
      'The number of orders that customers paid for, including refunded orders. Unpaid, failed and cancelled orders are not counted.',
      'kirki-ecommerce',
    ),
    value: metrics === undefined ? undefined : String(metrics.orders_count),
  },
  {
    label: __('Products sold', 'kirki-ecommerce'),
    info: __(
      'The number of product units in paid orders. Refunded units are not removed.',
      'kirki-ecommerce',
    ),
    value: metrics === undefined ? undefined : String(metrics.products_sold),
  },
];

const DashboardOverview = () => {
  const { data, isLoading, isError, isFetching, refetch } = useDashboardOverviewQuery();

  if (isError || (!isLoading && !data)) {
    return <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />;
  }

  return (
    <Flex direction="column" gap={2}>
      <div css={scoped(styles.metrics)}>
        {getMetricCards(data?.metrics).map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            info={metric.info}
            value={metric.value}
          />
        ))}
      </div>
      <div css={scoped(styles.lists)}>
        <RecentOrdersCard orders={data?.recent_orders} />
        <TopProductsCard products={data?.top_products} />
      </div>
    </Flex>
  );
};

DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;

const styles = defineStyles({
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: theme.spacing[3],
    '@media (min-width: 600px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    },
  },
  lists: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: theme.spacing[3],
    '@media (min-width: 782px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
});
