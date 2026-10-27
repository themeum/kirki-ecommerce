import { keyframes } from '@emotion/react';

import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import StatusBadge from '@/features/analytics/components/status-badge';
import { formatNumber } from '@/features/analytics/lib/format';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const STATUS_TONES = {
  out_of_stock: 'critical',
  low_stock: 'warning',
  in_stock: 'success',
} as const;

const COUNT_COLORS = {
  out_of_stock: 'critical',
  low_stock: 'warning',
  in_stock: undefined,
} as const;

const getStatusLabels = (): Record<string, string> => ({
  out_of_stock: __('Out of stock', 'kirki-ecommerce'),
  low_stock: __('Low stock', 'kirki-ecommerce'),
  in_stock: __('In stock', 'kirki-ecommerce'),
});

const InventoryHealthCard = (props: Pick<CardProps<'inventory_health'>, 'data'>) => {
  const { data } = props;
  const definition = getMetricDefinitions().inventory_health;
  const labels = getStatusLabels();
  const counts = [
    { status: 'out_of_stock', count: data.out_of_stock },
    { status: 'low_stock', count: data.low_stock },
    { status: 'in_stock', count: data.in_stock },
  ] as const;

  return (
    <AnalyticsCard title={definition.title} info={definition.info} testId="card-inventory_health">
      <div css={scoped(styles.counts)}>
        {counts.map((item) => (
          <div key={item.status} css={scoped(styles.count)}>
            <Text variant="heading4" weight="bold" color={COUNT_COLORS[item.status]}>
              {formatNumber(item.count)}
            </Text>
            <Text variant="small" color="subdued">
              {labels[item.status]}
            </Text>
          </div>
        ))}
      </div>
      {data.lowest.length > 0 && (
        <ul css={scoped(styles.list)}>
          {data.lowest.map((variant) => (
            <li key={variant.variant_id} css={scoped(styles.row)}>
              <div css={scoped(styles.text)}>
                <Text variant="small" weight="medium" truncate>
                  {variant.product_name}
                </Text>
                {variant.variant_name && (
                  <Text variant="small" color="subdued" truncate>
                    {variant.variant_name}
                  </Text>
                )}
              </div>
              <StatusBadge
                tone={STATUS_TONES[variant.status as keyof typeof STATUS_TONES] ?? 'neutral'}
              >
                {labels[variant.status] ?? variant.status}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
      <div css={scoped(styles.live)}>
        <span aria-hidden="true" data-testid="live-indicator" css={scoped(styles.dot)} />
        <Text variant="tiny" color="subdued">
          {__('Live, not affected by the date range', 'kirki-ecommerce')}
        </Text>
      </div>
    </AnalyticsCard>
  );
};

InventoryHealthCard.displayName = 'InventoryHealthCard';

export default InventoryHealthCard;

const ripple = keyframes({
  from: {
    transform: 'scale(1)',
    opacity: 0.6,
  },
  to: {
    transform: 'scale(2.5)',
    opacity: 0,
  },
});

const styles = defineStyles({
  counts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: theme.spacing[3],
  },
  count: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    minWidth: 0,
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceAlt,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing[3],
    margin: 0,
    minWidth: 0,
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    '&:not(:first-of-type)': {
      borderTop: `1px solid ${theme.colors.border.default}`,
    },
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  live: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  dot: {
    position: 'relative',
    flexShrink: 0,
    width: '8px',
    height: '8px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.text.success,
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      backgroundColor: 'inherit',
      animation: `${ripple} 2s ease-out infinite`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&::after': {
        animation: 'none',
        opacity: 0,
      },
    },
  },
});
