import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QueryErrorState from '@/components/ui/query-error-state';
import Text from '@/components/ui/text';
import { AmountFormatProvider, useAnalyticsMetricQuery } from '@/features/analytics';
import KeyNumbersSection from '@/features/home/components/key-numbers-section';
import NeedsAttentionCard from '@/features/home/components/needs-attention-card';
import RecentOrdersCard from '@/features/home/components/recent-orders-card';
import RestockSoonCard from '@/features/home/components/restock-soon-card';
import TopProductsCard from '@/features/home/components/top-products-card';
import type { HomeLayoutControls } from '@/features/home/hooks/use-home-layout';
import { getPeriodParams, type SectionKey } from '@/features/home/lib/layout';
import { getSectionSpans } from '@/features/home/lib/section-spans';
import {
  useDashboardAttentionQuery,
  useDashboardOverviewQuery,
} from '@/features/home/services/dashboard';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type HomeSectionsProps = {
  layoutControls: HomeLayoutControls;
  onCustomize: () => void;
};

const HomeSections = (props: HomeSectionsProps) => {
  const { layoutControls, onCustomize } = props;
  const { layout, setVisible } = layoutControls;
  const visibleSections = layout.sections.filter((item) => item.visible).map((item) => item.key);
  const isVisible = (key: SectionKey) => visibleSections.includes(key);
  const periodParams = getPeriodParams(layout.period);
  const hasKeyNumbers = layout.kpis.some((item) => item.visible);

  const overview = useDashboardOverviewQuery(isVisible('recent_orders'));
  const kpis = useAnalyticsMetricQuery(
    'kpis',
    periodParams,
    isVisible('key_numbers') && hasKeyNumbers,
  );
  const topProducts = useAnalyticsMetricQuery(
    'sales_by_product',
    periodParams,
    isVisible('top_products'),
  );
  const attention = useDashboardAttentionQuery(
    isVisible('needs_attention') || isVisible('restock_soon'),
  );

  if (visibleSections.length === 0) {
    return (
      <Card cssOverride={styles.empty}>
        <Text color="subdued">
          {__('Every section is hidden.', 'kirki-ecommerce')}{' '}
          <Button variant="link" onClick={onCustomize}>
            {__('Customize Home', 'kirki-ecommerce')}
          </Button>{' '}
          {__('to add some back.', 'kirki-ecommerce')}
        </Text>
      </Card>
    );
  }

  const hideSection = (key: SectionKey) => () => setVisible('sections', key, false);
  const spans = getSectionSpans(visibleSections);

  const renderSection = (key: SectionKey): ReactNode => {
    switch (key) {
      case 'key_numbers':
        return (
          <KeyNumbersSection
            items={layout.kpis}
            query={kpis}
            onHide={(kpi) => setVisible('kpis', kpi, false)}
            onCustomize={onCustomize}
          />
        );
      case 'recent_orders':
        return overview.isError ? (
          <QueryErrorState
            onRetry={() => void overview.refetch()}
            isRetrying={overview.isFetching}
          />
        ) : (
          <RecentOrdersCard
            orders={overview.data?.recent_orders}
            onHide={hideSection('recent_orders')}
          />
        );
      case 'top_products':
        return topProducts.isError ? (
          <QueryErrorState
            onRetry={() => void topProducts.refetch()}
            isRetrying={topProducts.isFetching}
          />
        ) : (
          <TopProductsCard
            products={topProducts.data?.data.items}
            onHide={hideSection('top_products')}
          />
        );
      case 'restock_soon':
        return <RestockSoonCard query={attention} onHide={hideSection('restock_soon')} />;
      case 'needs_attention':
        return <NeedsAttentionCard query={attention} onHide={hideSection('needs_attention')} />;
    }
  };

  return (
    <AmountFormatProvider format={layout.amounts}>
      <div css={scoped(styles.grid)}>
        {visibleSections.map((key) => (
          <div
            key={key}
            data-testid={`home-section-${key}`}
            data-span={spans.get(key)}
            data-home-card=""
            css={scoped(styles.cell)}
          >
            {renderSection(key)}
          </div>
        ))}
      </div>
    </AmountFormatProvider>
  );
};

HomeSections.displayName = 'HomeSections';

export default HomeSections;

const styles = defineStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: theme.spacing[3],
    '@media (min-width: 782px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    '& > *': {
      flex: '1 1 auto',
    },
    '&[data-span="full"]': {
      gridColumn: '1 / -1',
    },
  },
  empty: {
    alignItems: 'center',
    padding: theme.spacing[6],
    textAlign: 'center',
  },
});
