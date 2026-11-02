import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CardEmpty = () => {
  return (
    <Text variant="small" color="subdued" cssOverride={styles.empty} data-testid="card-empty">
      {__('No data for this date range', 'kirki-ecommerce')}
    </Text>
  );
};

CardEmpty.displayName = 'CardEmpty';

export default CardEmpty;

const styles = defineStyles({
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
    padding: theme.spacing[4],
    textAlign: 'center',
  },
});
