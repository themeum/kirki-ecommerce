import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import ChangeBadge from '@/features/analytics/components/change-badge';
import { useMoney } from '@/features/analytics/contexts/amount-format-context';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type TotalSalesBreakdownCardProps = CardProps<'total_sales_breakdown'>;

const BOLD_ROWS = ['net_sales', 'total_sales'];
const NEGATIVE_ROWS = ['discounts', 'returns'];

const getRowLabels = (): Record<string, string> => ({
  gross_sales: __('Gross sales', 'kirki-ecommerce'),
  discounts: __('Discounts', 'kirki-ecommerce'),
  returns: __('Returns', 'kirki-ecommerce'),
  net_sales: __('Net sales', 'kirki-ecommerce'),
  shipping: __('Shipping charges', 'kirki-ecommerce'),
  taxes: __('Taxes', 'kirki-ecommerce'),
  total_sales: __('Total sales', 'kirki-ecommerce'),
});

const TotalSalesBreakdownCard = (props: TotalSalesBreakdownCardProps) => {
  const { data, isEmpty } = props;
  const { money } = useMoney();
  const definition = getMetricDefinitions().total_sales_breakdown;
  const labels = getRowLabels();

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-total_sales_breakdown"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <ul css={scoped(styles.list)}>
          {data.rows.map((row) => {
            const isBold = BOLD_ROWS.includes(row.key);
            const amount = row.current_money_object;
            const isNegative =
              NEGATIVE_ROWS.includes(row.key) && !!amount && Number(amount.raw) > 0;
            const sign = isNegative ? '−' : '';
            const value = money(amount);

            return (
              <li
                key={row.key}
                data-testid={`breakdown-row-${row.key}`}
                data-emphasis={isBold ? 'bold' : undefined}
                css={scoped(mergeCss(styles.row, isBold && styles.boldRow))}
              >
                <Text variant="small" weight={isBold ? 'semibold' : 'normal'}>
                  {labels[row.key] ?? row.key}
                </Text>
                <span css={scoped(styles.amount)}>
                  <Text
                    variant="small"
                    weight={isBold ? 'semibold' : 'normal'}
                    title={value.title && `${sign}${value.title}`}
                  >
                    {`${sign}${value.text}`}
                  </Text>
                  <ChangeBadge change={row.change} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsCard>
  );
};

TotalSalesBreakdownCard.displayName = 'TotalSalesBreakdownCard';

export default TotalSalesBreakdownCard;

const styles = defineStyles({
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
    margin: 0,
    padding: `${theme.spacing[2]} 0`,
    borderBottom: `1px solid ${theme.colors.analytics.chart.grid}`,
  },
  boldRow: {
    borderBottomColor: theme.colors.analytics.chart.gridBase,
  },
  amount: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
});
