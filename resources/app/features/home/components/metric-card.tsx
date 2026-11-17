import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { CardMenu } from '@/features/analytics';
import OverviewTitle from '@/features/home/components/overview-title';
import SkeletonLine from '@/features/home/components/skeleton-line';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type MetricCardProps = {
  label: string;
  info: string;
  value?: string;
  valueTitle?: string;
  onHide?: () => void;
};

const MetricCard = (props: MetricCardProps) => {
  const { label, info, value, valueTitle, onHide } = props;

  return (
    <Card cssOverride={styles.card}>
      <Flex align="center" gap={2}>
        <OverviewTitle info={info}>
          <Text variant="small" color="primary">
            {label}
          </Text>
        </OverviewTitle>
        {onHide && <CardMenu title={label} canHide onHide={onHide} />}
      </Flex>
      {value === undefined ? (
        <SkeletonLine width="120px" lineHeight="26px" barHeight="20px" />
      ) : (
        <Text variant="heading4" weight="bold" truncate title={valueTitle}>
          {value}
        </Text>
      )}
    </Card>
  );
};

MetricCard.displayName = 'MetricCard';

export default MetricCard;

const HIDDEN_PARTS = '& [data-tooltip], & [data-card-menu]';

const styles = defineStyles({
  card: {
    gap: theme.spacing[1],
    padding: theme.spacing[3],
    minWidth: 0,
    [HIDDEN_PARTS]: {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    [[
      '&:hover [data-tooltip]',
      '&:hover [data-card-menu]',
      '&:focus-within [data-card-menu]',
      '& [data-card-menu][data-state="open"]',
    ].join(', ')]: {
      opacity: 1,
    },
    '@media (hover: none)': {
      [HIDDEN_PARTS]: {
        opacity: 1,
      },
    },
  },
});
