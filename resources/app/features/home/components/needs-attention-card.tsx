import type { UseQueryResult } from '@tanstack/react-query';
import { Banknote, CheckCircle2, PackageX, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import Flex from '@/components/ui/flex';
import QueryErrorState from '@/components/ui/query-error-state';
import { StackedItem, StackedItems } from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useMoney } from '@/features/analytics';
import OverviewCard from '@/features/home/components/overview-card';
import OverviewTitle from '@/features/home/components/overview-title';
import SkeletonLine from '@/features/home/components/skeleton-line';
import type { DashboardAttention } from '@/features/home/schemas/catalog/dashboard-attention';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type AttentionCheck = {
  key: 'to_ship' | 'to_collect' | 'out_of_stock';
  label: string;
  info: string;
  icon: ReactNode;
  count: number;
  detail?: string;
  detailTitle?: string;
  to: string;
};

type NeedsAttentionCardProps = {
  query: UseQueryResult<DashboardAttention>;
  onHide: () => void;
};

const useAttentionChecks = (data: DashboardAttention): AttentionCheck[] => {
  const { money } = useMoney();
  const toCollect = money(data.to_collect.base_total_money_object);

  return [
    {
      key: 'to_ship',
      label: __('Orders to ship', 'kirki-ecommerce'),
      info: __(
        'Orders that are not fulfilled or are processing, and are paid or wait for an offline payment. Archived orders are left out.',
        'kirki-ecommerce',
      ),
      icon: <Truck size={16} aria-hidden="true" />,
      count: data.to_ship.count,
      detail:
        data.to_ship.late_count > 0
          ? sprintf(
              /* translators: %d: number of orders waiting over 2 days */
              _n(
                '%d waiting over 2 days',
                '%d waiting over 2 days',
                data.to_ship.late_count,
                'kirki-ecommerce',
              ),
              data.to_ship.late_count,
            )
          : undefined,
      to: `${RouteConfig.Orders.buildLink()}?attention=to_ship`,
    },
    {
      key: 'to_collect',
      label: __('Payments to collect', 'kirki-ecommerce'),
      info: __(
        'Unpaid orders with an offline payment method that are not cancelled, and payments that failed in the last 7 days.',
        'kirki-ecommerce',
      ),
      icon: <Banknote size={16} aria-hidden="true" />,
      count: data.to_collect.count,
      detail: data.to_collect.count > 0 ? toCollect.text : undefined,
      detailTitle: toCollect.title,
      to: `${RouteConfig.Orders.buildLink()}?attention=to_collect`,
    },
    {
      key: 'out_of_stock',
      label: __('Out of stock', 'kirki-ecommerce'),
      info: __(
        'Variants that cannot be sold now: tracked with no stock left, or not tracked and marked out of stock.',
        'kirki-ecommerce',
      ),
      icon: <PackageX size={16} aria-hidden="true" />,
      count: data.out_of_stock.count,
      to: `${RouteConfig.Inventory.buildLink()}?inventory_type=out_of_stock`,
    },
  ];
};

type AttentionRowsProps = {
  data: DashboardAttention;
};

const AttentionRows = ({ data }: AttentionRowsProps) => {
  const checks = useAttentionChecks(data);
  const ordered = [
    ...checks.filter((check) => check.count > 0),
    ...checks.filter((check) => check.count === 0),
  ];

  return (
    <StackedItems>
      {ordered.map((check) => (
        <StackedItem key={check.key} id={check.key} cssOverride={styles.item}>
          <Link
            to={check.to}
            css={scoped(styles.row)}
            data-testid={`attention-${check.key}`}
            data-pending={check.count > 0 ? 'true' : undefined}
          >
            <span css={scoped(styles.icon)}>{check.icon}</span>
            <Flex direction="column" cssOverride={styles.text}>
              <OverviewTitle info={check.info}>
                <Text weight="medium" color="primary" variant="small">
                  {check.label}
                </Text>
              </OverviewTitle>
              {check.detail && (
                <Text variant="tiny" color="warning" title={check.detailTitle}>
                  {check.detail}
                </Text>
              )}
            </Flex>
            {check.count > 0 ? (
              <Text variant="small" weight="medium">
                {check.count}
              </Text>
            ) : (
              <Flex align="center" gap={1}>
                <CheckCircle2
                  size={16}
                  aria-hidden="true"
                  fill={theme.colors.icon.success}
                  color={theme.colors.background.fill}
                />
                <Text variant="tiny" color="secondary">
                  {__('Clear', 'kirki-ecommerce')}
                </Text>
              </Flex>
            )}
          </Link>
        </StackedItem>
      ))}
    </StackedItems>
  );
};

AttentionRows.displayName = 'AttentionRows';

const getSummary = (data: DashboardAttention) => {
  const total = 3;
  const pending = [data.to_ship.count, data.to_collect.count, data.out_of_stock.count].filter(
    (count) => count > 0,
  ).length;

  if (pending === 0) {
    return { text: __('All caught up', 'kirki-ecommerce'), isPending: false };
  }

  return {
    text: sprintf(
      /* translators: 1: number of checks that need work, 2: number of checks */
      __('%1$d of %2$d need you', 'kirki-ecommerce'),
      pending,
      total,
    ),
    isPending: true,
  };
};

const NeedsAttentionCard = (props: NeedsAttentionCardProps) => {
  const { query } = props;
  const summary = query.data ? getSummary(query.data) : null;

  return (
    <OverviewCard
      title={__('Needs your attention', 'kirki-ecommerce')}
      info={__(
        'Work that waits for you now. Select a row to see the orders or variants.',
        'kirki-ecommerce',
      )}
      headerExtra={summary && <Text variant="tiny">{summary.text}</Text>}
    >
      <div css={scoped(styles.body)}>
        {query.isError ? (
          <QueryErrorState onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
        ) : query.data ? (
          <AttentionRows data={query.data} />
        ) : (
          <StackedItems>
            {Array.from({ length: 3 }, (_, index) => (
              <StackedItem key={index} id={String(index)} cssOverride={styles.item}>
                <div css={scoped(styles.row)}>
                  <SkeletonLine width="60%" lineHeight="22px" />
                </div>
              </StackedItem>
            ))}
          </StackedItems>
        )}
      </div>
    </OverviewCard>
  );
};

NeedsAttentionCard.displayName = 'NeedsAttentionCard';

export default NeedsAttentionCard;

const styles = defineStyles({
  body: {
    padding: `0 ${theme.spacing[3]} ${theme.spacing[6]} ${theme.spacing[3]}`,
  },
  item: {
    height: 'auto',
    padding: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    width: '100%',
    minHeight: '56px',
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    boxSizing: 'border-box',
    color: 'inherit',
    textDecoration: 'none',
  },
  icon: {
    display: 'inline-flex',
    flexShrink: 0,
    color: theme.colors.icon.secondary,
    border: `1px solid ${theme.colors.border.default}`,
    width: '32px',
    height: '32px',
    ...flexCenter(),
    borderRadius: theme.radius.lg,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
});
