import { Info } from 'lucide-react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const StorePagesNote = () => {
  return (
    <Flex gap={2} align="center" cssOverride={styles.note}>
      <Info size={16} aria-hidden="true" />
      <Text variant="small" color="secondary">
        {__('Shop, Cart, Checkout and Account pages will be created', 'kirki-ecommerce')}
      </Text>
    </Flex>
  );
};

StorePagesNote.displayName = 'StorePagesNote';

export default StorePagesNote;

const styles = defineStyles({
  note: {
    padding: theme.spacing[2],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.solidSurfaceAlt,
    color: theme.colors.icon.secondary,
  },
});
