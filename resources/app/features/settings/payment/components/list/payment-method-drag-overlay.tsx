import { DragHandleDots2Icon } from '@radix-ui/react-icons';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type PaymentMethodDragOverlayProps = {
  method: PaymentMethod;
};

const PaymentMethodDragOverlay = (props: PaymentMethodDragOverlayProps) => {
  const { method } = props;

  return (
    <Flex align="center" gap={2} cssOverride={styles.root}>
      <span css={scoped(styles.handle)}>
        <DragHandleDots2Icon />
      </span>
      <Text weight="medium" color="primary">
        {method.name}
      </Text>
    </Flex>
  );
};

PaymentMethodDragOverlay.displayName = 'PaymentMethodDragOverlay';

export default PaymentMethodDragOverlay;

const styles = defineStyles({
  root: {
    height: '34px',
    padding: `${theme.spacing[1]} ${theme.spacing[1]} ${theme.spacing[1]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    boxShadow: theme.shadow.md,
    cursor: 'grabbing',
  },
  handle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: theme.colors.icon.secondary,
  },
});
