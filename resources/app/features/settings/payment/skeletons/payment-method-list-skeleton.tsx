import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

const nameWidths = [148, 120, 132, 96, 116, 104, 88, 124, 100, 112, 92, 128];

const PaymentMethodListSkeleton = () => (
  <div aria-busy="true" css={scoped(styles.list)}>
    {nameWidths.map((width, index) => (
      <div key={index} css={scoped(styles.row)}>
        <Skeleton width={20} height={20} radius="sm" />
        <Skeleton width={width} height={14} />
      </div>
    ))}
  </div>
);

PaymentMethodListSkeleton.displayName = 'PaymentMethodListSkeleton';

export default PaymentMethodListSkeleton;

const styles = defineStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    columnGap: theme.spacing[2],
    minHeight: theme.spacing[10],
    padding: `0 ${theme.spacing[2]}`,
  },
});
