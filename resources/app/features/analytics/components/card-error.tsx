import QueryErrorState from '@/components/ui/query-error-state';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import type { AnalyticsCards } from '@/features/analytics/schemas/catalog/analytics';

type CardErrorProps = {
  cardKey: keyof AnalyticsCards;
  size: 'half' | 'full';
  onRetry: () => void;
};

const CardError = (props: CardErrorProps) => {
  const { cardKey, size, onRetry } = props;
  const definition = getMetricDefinitions()[cardKey];

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      size={size}
      testId={`card-error-${cardKey}`}
    >
      <QueryErrorState onRetry={onRetry} />
    </AnalyticsCard>
  );
};

CardError.displayName = 'CardError';

export default CardError;
