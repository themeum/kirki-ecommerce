import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ChangeBadge from '@/features/analytics/components/change-badge';

type CardHeadlineProps = {
  value: string;
  /** Hover title of the value, such as the long amount of a short amount. */
  valueTitle?: string;
  unit?: string;
  change?: number | null;
};

const CardHeadline = (props: CardHeadlineProps) => {
  const { value, valueTitle, unit, change } = props;

  return (
    <Flex align="center" gap={2} wrap="wrap">
      <Text variant="heading4" weight="bold" title={valueTitle}>
        {value}
      </Text>
      {unit && <Text color="subdued">{unit}</Text>}
      <ChangeBadge change={change} />
    </Flex>
  );
};

CardHeadline.displayName = 'CardHeadline';

export default CardHeadline;
