import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type RangeFooterProps = {
  summary: ReactNode;
  applyDisabled: boolean;
  onCancel: () => void;
  onApply: () => void;
};

const RangeFooter = ({ summary, applyDisabled, onCancel, onApply }: RangeFooterProps) => {
  return (
    <Flex align="center" justify="space-between" gap={3} cssOverride={styles.footer}>
      <Text variant="small" color="secondary">
        {summary}
      </Text>
      <Flex align="center" gap={2}>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {__('Cancel', 'kirki-ecommerce')}
        </Button>
        <Button variant="primary" size="sm" disabled={applyDisabled} onClick={onApply}>
          {__('Apply', 'kirki-ecommerce')}
        </Button>
      </Flex>
    </Flex>
  );
};

RangeFooter.displayName = 'RangeFooter';

export default RangeFooter;
export type { RangeFooterProps };

const styles = defineStyles({
  footer: {
    padding: theme.spacing[2],
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
});
