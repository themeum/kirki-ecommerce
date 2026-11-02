import { Card, CardContent } from '@/components/ui/card';
import type { EmptyStateProps } from '@/components/ui/empty-state';
import EmptyState from '@/components/ui/empty-state';
import Flex from '@/components/ui/flex';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const NotFoundState = ({
  text = __('No records found', 'kirki-ecommerce'),
  ...props
}: EmptyStateProps) => {
  return (
    <Flex direction="column" gap={4} cssOverride={{ minHeight: 64 }}>
      <Card cssOverride={cardStyles.tableCard} noShadow>
        <CardContent cssOverride={cardStyles.tableContent}>
          <EmptyState text={text} {...props} />
        </CardContent>
      </Card>
    </Flex>
  );
};

NotFoundState.displayName = 'NotFoundState';
export default NotFoundState;
